import React from "react";
import { Text } from "ink";
import { ShipulaContext, getStackName } from "../context";
import AWS, { CloudFormation } from "aws-sdk";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import { Machine, actions } from "xstate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

/**
 * The states of the state machine, listed out here for TypeScript.
 */
interface Schema {
  states: {
    starting: NoSubState;
    destroying: NoSubState;
    waiting: NoSubState;
    destroyed: NoSubState;
    error: NoSubState;
  };
}

/**
 * Transtion ye olde state machine
 */
type Events =
  | {
      type: "DELETE_FAILED";
    }
  | {
      type: "DELETE_IN_PROGRESS";
    }
  | {
      type: "DELETE_COMPLETE";
    };

/**
 * Little bit of context -- error tracking is nice.
 */
type Context = {
  lastError?: Error;
};

/**
 * No props needed, the app context is enough.
 */
type Props = never;

console.assert(actions);

const machine = Machine<Context, Schema, Events>({
  initial: "starting",
  states: {
    starting: {
      invoke: {
        src: "destroyStack",
        onError: {
          target: "error",
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
        },
        onDone: {
          target: "destroying",
        },
      },
    },
    destroying: {
      on: {
        DELETE_COMPLETE: {
          target: "destroyed",
        },
        DELETE_FAILED: {
          target: "error",
        },
      },
      invoke: {
        src: "stackStatus",
        onError: {
          target: "error",
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
        },
        onDone: {
          target: "waiting",
        },
      },
    },
    waiting: {
      after: {
        5000: "destroying",
      },
    },
    destroyed: {},
    error: {},
  },
});

/**
 * Gather and display information about a stack based
 * on the current context.
 */
export const Destroy: React.FunctionComponent<Props> = () => {
  const appContext = React.useContext(ShipulaContext);
  const [state, send] = useMachine(machine, {
    services: {
      stackStatus: async () => {
        // see where we are at in our quest to destroy things
        const cloudFormation = new AWS.CloudFormation();
        try {
          const stack = await new Promise<CloudFormation.DescribeStacksOutput>(
            (resolve, reject) => {
              cloudFormation.describeStacks(
                { StackName: getStackName(appContext) },
                (err, data) => {
                  if (err) reject(err);
                  else resolve(data);
                }
              );
            }
          );
          // these states direclty translate to our state machine.
          if (stack.Stacks[0].StackStatus === "DELETE_COMPLETE")
            send("DELETE_COMPLETE");
          if (stack.Stacks[0].StackStatus === "DELETE_FAILED")
            send("DELETE_FAILED");
        } catch (e) {
          if (e.message.endsWith("does not exist")) {
            send("DELETE_COMPLETE");
          } else {
            // errors throw out to error
            throw e;
          }
        }
      },
      destroyStack: async () => {
        const cloudFormation = new AWS.CloudFormation();
        await new Promise<CloudFormation.DescribeStacksOutput>(
          (resolve, reject) => {
            cloudFormation.deleteStack(
              { StackName: getStackName(appContext) },
              (err, data) => {
                if (err) reject(err);
                else resolve(data);
              }
            );
          }
        );
      },
    },
  });
  return (
    <>
      {state.value === "destroying" ||
        (state.value === "waiting" && (
          <Text>
            <Spinner type="dots" />
          </Text>
        ))}
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
      {state.value === "destroyed" && (
        <>
          <Text> ✅ {getStackName(appContext)} destroyed</Text>
          <Text> ⛴⛴💥</Text>
        </>
      )}
    </>
  );
};
