import requireCDKToolkit from "./require-cdk-toolkit";
import requireShipulaNetwork from "./require-shipula-network";
import requireAppStack, { Context } from "./require-app-stack";
import { getStackName } from "@shipula/context";
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
    checkingNetwork: NoSubState;
    checkingPackage: NoSubState;
    deploying: NoSubState;
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

export default Machine<Context, Schema, Events>({
  initial: "checkingSettings",
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
        onDone: "checkingNetwork",
        onError: "error",
      },
    },
    checkingNetwork: {
      invoke: {
        src: requireShipulaNetwork,
        data: (context) => context,
        onDone: "checkingPackage",
        onError: "error",
      },
    },
    checkingPackage: {
      invoke: {
        src: async (context) => {
          if (
            context?.package?.scripts?.build?.startsWith("docusaurus build") ||
            context?.package?.shipula?.static
          ) {
            context.deployStyle = "@shipula/static";
          } else {
            context.deployStyle = "@shipula/server";
          }
        },
        onDone: "deploying",
        onError: "error",
      },
    },
    deploying: {
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
