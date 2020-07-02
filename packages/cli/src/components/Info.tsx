import React from "react";
import { Text } from "ink";
import { ShipulaContext, getStackName } from "../context";
import { CloudFormation } from "aws-sdk";
import { Machine, actions } from "xstate";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

/**
 * Data loading state machine.
 */
interface LoadingSchema {
  states: {
    loading: NoSubState;
    loaded: NoSubState;
    displayingError: NoSubState;
  };
}

type LoadingContext = {
  stack?: CloudFormation.DescribeStacksOutput;
  lastError?: Error;
};

/**
 * No events on the loading machine -- it's just a promise
 */
type LoadingEvents = {
  type: "HELLO";
};

/**
 * The loading promise machine.
 */
export const machine = Machine<LoadingContext, LoadingSchema, LoadingEvents>({
  initial: "loading",
  states: {
    loading: {
      invoke: {
        src: "readData",
        onDone: {
          target: "loaded",
          actions: actions.assign({
            stack: (_context, event) => event?.data,
          }),
        },
        onError: {
          target: "displayingError",
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
        },
      },
    },
    loaded: {},
    displayingError: {},
  },
});

type Props = {
  none?: string;
};
/**
 * Gather and display information about a stack based
 * on the current context.
 */
export const Info: React.FunctionComponent<Props> = () => {
  const appContext = React.useContext(ShipulaContext);
  const [state, send] = useMachine(machine, {
    services: {
      readData: async (context) => {
        console.assert(context);
        console.assert(send);
        const cloudFormation = new CloudFormation();
        const stackInfo = await new Promise<
          CloudFormation.DescribeStacksOutput
        >((resolve, reject) => {
          cloudFormation.describeStacks(
            { StackName: getStackName(appContext) },
            (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            }
          );
        });
        return stackInfo;
      },
    },
  });
  console.assert(appContext);
  console.assert(getStackName);
  console.assert(send);
  console.assert(actions);
  return (
    <>
      {state.value === "verifyingCredentials" && (
        <Text>
          <Spinner type="dots" />
        </Text>
      )}
      {state.value === "displayingError" && (
        <ErrorMessage error={state.context.lastError} />
      )}
      {state.value === "loaded" && (
        <Text>{state.context.stack.toString()}</Text>
      )}
    </>
  );
};
