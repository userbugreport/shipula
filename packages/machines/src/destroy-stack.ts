import { ShipulaContextProps, getStackName, Info } from "@shipula/context";
import { Machine, actions } from "xstate";
import AWS, { CloudFormation } from "aws-sdk";
import assert from "assert";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

/**
 * The states of the state machine, listed out here for TypeScript.
 */
interface Schema {
  states: {
    checkingSettings: NoSubState;
    listingStacks: NoSubState;
    destroyingStack: NoSubState;
    error: NoSubState;
    done: NoSubState;
  };
}

/**
 * Transtion ye olde state machine
 */
type Events = {
  type: "*";
  data: Error;
};

/**
 * Little bit of context -- error tracking is nice.
 */
type Context = ShipulaContextProps;

export default Machine<Context, Schema, Events>({
  initial: "checkingSettings",
  states: {
    checkingSettings: {
      invoke: {
        src: async (context) => {
          assert(getStackName(context.package.name, context.stackName));
        },
        onDone: "destroyingStack",
        onError: "listingStacks",
      },
    },
    listingStacks: {
      invoke: {
        src: async (context) => {
          context.stacks = await Info.listShipulaStacks();
        },
        onDone: "done",
        onError: "error",
      },
    },
    destroyingStack: {
      invoke: {
        src: async (context) => {
          const cloudFormation = new AWS.CloudFormation();
          await new Promise<CloudFormation.DescribeStacksOutput>(
            (resolve, reject) => {
              cloudFormation.deleteStack(
                {
                  StackName: getStackName(
                    context.package.name,
                    context.stackName
                  ),
                },
                (err, data) => {
                  if (err) reject(err);
                  else resolve(data);
                }
              );
            }
          );
        },
        onDone: "done",
        onError: "error",
      },
    },
    done: { type: "final" },
    error: {
      type: "final",
      entry: actions.assign({
        lastError: (_context, event) => event?.data,
      }),
    },
  },
});
