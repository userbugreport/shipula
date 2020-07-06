import { ShipulaContextProps, getStackName } from "../context";
import { Machine, actions } from "xstate";
import infoStack from "./info-stack";
import AWS from "aws-sdk";
import assert from "assert";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

/**
 * The states of the state machine, listed out here for TypeScript.
 */
interface Schema {
  states: {
    checkingSettings: NoSubState;
    infoStack: NoSubState;
    setParameters: NoSubState;
    maybeDeploying: NoSubState;
    deploying: NoSubState;
    restarting: NoSubState;
    error: NoSubState;
    done: NoSubState;
  };
}
/**
 * Transtion ye olde state machine
 */
type Events = {
  data: Error;
} & (
  | {
      type: "DEPLOYING";
    }
  | {
      type: "RESTARTING";
    }
);

/**
 * Little bit of context -- error tracking is nice.
 */
type Context = ShipulaContextProps;

/**
 * Setting an environment variable in systems manager.
 *
 * Variables are arranged in a namespace
 * /shipula/app/stack/variable
 */
export default Machine<Context, Schema, Events>({
  initial: "checkingSettings",
  states: {
    checkingSettings: {
      invoke: {
        src: async (context) => {
          // clean up the stack path
          assert(getStackName(context));
          // clean up the env parameter name
        },
        onDone: "setParameters",
        onError: "error",
      },
    },
    setParameters: {
      invoke: {
        src: async (context) => {
          assert(context);
          assert(AWS);
        },
        onDone: "infoStack",
        onError: "error",
      },
    },
    infoStack: {
      invoke: {
        src: infoStack,
        data: (context) => context,
        onDone: "maybeDeploying",
        onError: "error",
      },
    },
    maybeDeploying: {
      entry: actions.pure((context) => {
        assert(context);
        if (true) {
          return actions.send("DEPLOYING");
        } else {
          return actions.send("RESTARTING");
        }
      }),
      on: {
        DEPLOYING: "deploying",
        RESTARTING: "restarting",
      },
    },
    restarting: {},
    deploying: {},
    error: {
      type: "final",
      entry: actions.assign({
        lastError: (_context, event) => event?.data,
      }),
    },
    done: {
      type: "final",
    },
  },
});
