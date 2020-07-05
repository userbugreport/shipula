import { ShipulaContextProps, getStackName } from "../context";
import { Machine, actions } from "xstate";
import { listShipulaStacks } from "../aws/info";
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
    describingStack: NoSubState;
    waiting: NoSubState;
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
          assert(getStackName(context));
        },
        onDone: "describingStack",
        onError: "listingStacks",
      },
    },
    listingStacks: {
      invoke: {
        src: async (context) => {
          context.stacks = await listShipulaStacks();
        },
        onDone: "done",
        onError: "error",
      },
    },
    describingStack: {
      invoke: {
        src: async (context) => {
          assert(context);
        },
        onDone: "waiting",
        onError: "error",
      },
    },
    waiting: {
      after: {
        1000: "describingStack",
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
