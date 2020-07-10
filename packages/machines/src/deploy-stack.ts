import requireCDKToolkit from "./require-cdk-toolkit";
import requireAppStack from "./require-app-stack";
import { ShipulaContextProps, getStackName } from "@shipula/context";
import { Machine, actions } from "xstate";
import assert from "assert";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

/**
 * The states of the state machine, listed out here for TypeScript.
 */
interface Schema {
  states: {
    checkingSettings: NoSubState;
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
    checkingSettings: {
      invoke: {
        src: async (context) => {
          assert(getStackName(context.package.name, context.stackName));
        },
        onDone: "checkingCDKToolkit",
        onError: "error",
      },
    },
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
