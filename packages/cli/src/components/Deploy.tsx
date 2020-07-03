import React from "react";
import { Text } from "ink";
import { ShipulaContext, ShipulaContextProps } from "../context";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import { Machine, actions } from "xstate";
import requireCDKToolkit from "../machines/require-cdk-toolkit";
import requireAppStack from "../machines/require-app-stack";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

/**
 * The states of the state machine, listed out here for TypeScript.
 */
interface Schema {
  states: {
    checkingCDKToolkit: NoSubState;
    checkingAppStack: NoSubState;
    deployed: NoSubState;
    error: NoSubState;
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

/**
 * No props needed, the app context is enough.
 */
type Props = never;

const machine = Machine<Context, Schema, Events>({
  initial: "checkingCDKToolkit",
  states: {
    checkingCDKToolkit: {
      invoke: {
        src: requireCDKToolkit,
        data: (context) => context,
        onDone: "checkingAppStack",
        onError: "error",
      },
    },
    checkingAppStack: {
      invoke: {
        src: requireAppStack,
        data: (context) => context,
        onDone: "deployed",
        onError: "error",
      },
    },
    deployed: { type: "final" },
    error: {
      type: "final",
      entry: actions.assign({
        lastError: (_context, event) => event?.data,
      }),
    },
  },
});

/**
 * Gather and display information about a stack based
 * on the current context.
 */
export const Deploy: React.FunctionComponent<Props> = () => {
  const appContext = React.useContext(ShipulaContext);
  const [state] = useMachine(machine, {
    context: appContext,
    services: {},
  });
  return (
    <>
      {!state.done && (
        <Text>
          <Spinner type="dots" /> {state.value}
        </Text>
      )}
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};
