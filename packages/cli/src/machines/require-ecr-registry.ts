import { Machine } from "xstate";
import { ShipulaContextProps } from "../context";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    checking: NoSubState;
    creating: NoSubState;
    ready: NoSubState;
    error: NoSubState;
  };
}

type Context = ShipulaContextProps;

type Events = never;

/**
 * We will need an ECR in order to store our containers to deploy on ECS.
 */
export default Machine<Context, Schema, Events>({
  initial: "checking",
  states: {
    checking: {
      invoke: {
        src: async () => {
          throw Error("failed checking");
        },
        onDone: "ready",
        onError: "creating",
      },
    },
    creating: {
      invoke: {
        src: async () => {
          throw new Error("failed creating");
        },
        onDone: "ready",
        onError: "error",
      },
    },
    ready: { type: "final" },
    error: {},
  },
});
