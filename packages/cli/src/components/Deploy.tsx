import React from "react";
import { Text } from "ink";
import { ShipulaContext, getStackName } from "../context";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import shell from "shelljs";
import path from "path";
import appRoot from "app-root-path";
import { Machine, actions } from "xstate";
import docs from "../docs";
import requireCDKToolkit from "../machines/require-cdk-toolkit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

/**
 * The states of the state machine, listed out here for TypeScript.
 */
interface Schema {
  states: {
    checkingCDKToolkit: NoSubState;
    buildingContainer: NoSubState;
    deployingAppStack: NoSubState;
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
type Context = {
  lastError?: Error;
};

/**
 * No props needed, the app context is enough.
 */
type Props = never;

console.assert(actions);

const machine = Machine<Context, Schema, Events>({
  initial: "checkingCDKToolkit",
  states: {
    checkingCDKToolkit: {
      invoke: {
        src: requireCDKToolkit,
        onDone: "buildingContainer",
        onError: "error",
      },
    },
    buildingContainer: {
      invoke: {
        src: "buildContainer",
        onError: {
          target: "error",
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
        },
        onDone: {
          target: "deployingAppStack",
        },
      },
    },
    deployingAppStack: {
      invoke: {
        src: "deployAppStack",
        onError: {
          target: "error",
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
        },
        onDone: {
          target: "deployed",
        },
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
  console.assert(appContext);
  const [state] = useMachine(machine, {
    services: {
      buildContainer: async () => {
        // need Docker
        if (!shell.which("docker")) {
          throw new Error(docs("docker.md"));
        }
      },
      deployAppStack: async () => {
        return;
        await new Promise((resolve, reject) => {
          // need an app path
          const CDKSynthesizer = path.resolve(__dirname, "..", "aws", "index");
          const CDK = path.resolve(appRoot.path, "node_modules", ".bin", "cdk");
          const TSNODE = path.resolve(
            appRoot.path,
            "node_modules",
            ".bin",
            "ts-node"
          );
          const TAGS = `--tags packageName=${appContext.package.name} --tags stackName=${appContext.stackName}`;
          process.env.STACK_NAME = getStackName(appContext);
          const child = shell.exec(
            `${CDK} deploy --require-approval never ${TAGS} --app "${TSNODE} ${CDKSynthesizer}"`,
            { async: true }
          );
          child.once("exit", (code) => {
            if (code) reject(code);
            else resolve();
          });
        });
      },
    },
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
