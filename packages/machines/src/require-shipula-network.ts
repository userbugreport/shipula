import { Machine, actions } from "xstate";
import { ErrorMessage, setShipulaEnvironmentForCDK } from "@shipula/context";
import { CDK } from "./cdk";
import execa from "execa";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    creating: NoSubState;
    ready: NoSubState;
  };
}

type Context = NoSubState;

type Events = never;

/**
 * Need a shared network
 */
export default Machine<Context, Schema, Events>({
  initial: "creating",
  states: {
    creating: {
      invoke: {
        src: async (context) => {
          // need an app path
          const CDKSynthesizer = require.resolve("@shipula/network");

          const CONTEXT = [];
          const TAGS = [];
          setShipulaEnvironmentForCDK(context);
          // synchronous run -- with inherited stdio, this should re-use the
          // CDK text UI for us
          const child = execa.sync(
            CDK,
            [
              "deploy",
              "--require-approval",
              "never",
              "--app",
              CDKSynthesizer,
              ...TAGS,
              ...CONTEXT,
            ],
            {
              stdio: "inherit",
            }
          );
          if (child.exitCode) {
            throw new ErrorMessage(`Exit ${child.exitCode}`);
          }
        },
        onDone: "ready",
        onError: {
          actions: actions.escalate((_context, event) => event.data),
        },
      },
    },
    ready: { type: "final" },
  },
});
