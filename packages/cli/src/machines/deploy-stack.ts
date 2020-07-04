import requireCDKToolkit from "./require-cdk-toolkit";
import requireAppStack from "./require-app-stack";
import { ShipulaContextProps } from "../context";
import { Machine, actions } from "xstate";

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

export default Machine<Context, Schema, Events>({
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
