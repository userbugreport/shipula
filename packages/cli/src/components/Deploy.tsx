import React from "react";
import { Text } from "ink";
import { ShipulaContext } from "../context";
import AWS, { CloudFormation } from "aws-sdk";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import shell from "shelljs";
import path from "path";
import appRoot from "app-root-path";
import { Machine, actions } from "xstate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

/**
 * The states of the state machine, listed out here for TypeScript.
 */
interface Schema {
  states: {
    checkingCDKToolkit: NoSubState;
    startingCDKToolkitDeploy: NoSubState;
    deployingCDKToolkit: NoSubState;
    checkingContainer: NoSubState;
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
  type: "CDK_INSTALLING";
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
      on: {
        CDK_INSTALLING: {
          target: "deployingCDKToolkit",
        },
      },
      // figure out with a promise
      invoke: {
        src: "describeCDK",
        onError: {
          target: "startingCDKToolkitDeploy",
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
        },
        onDone: {
          target: "checkingContainer",
        },
      },
    },
    startingCDKToolkitDeploy: {
      invoke: {
        src: "deployCDK",
        onError: {
          target: "error",
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
        },
        onDone: {
          target: "checkingContainer",
        },
      },
    },
    deployingCDKToolkit: {
      after: {
        1000: "checkingCDKToolkit",
      },
    },
    checkingContainer: {},
    buildingContainer: {},
    deployingAppStack: {},
    deployed: {},
    error: {},
  },
});

/**
 * Gather and display information about a stack based
 * on the current context.
 */
export const Deploy: React.FunctionComponent<Props> = () => {
  const appContext = React.useContext(ShipulaContext);
  console.assert(appContext);
  const [state, send] = useMachine(machine, {
    services: {
      describeCDK: async (context) => {
        console.assert(context);
        // and we're always going to need the CDKToolkit -- so use looking for
        // that as the auth check
        // let exceptions out -- the state machine will handle
        const cloudFormation = new AWS.CloudFormation();
        const CDKToolkit = await new Promise<
          CloudFormation.DescribeStacksOutput
        >((resolve, reject) => {
          cloudFormation.describeStacks(
            { StackName: "CDKToolkit" },
            (err, data) => {
              if (err) reject(err);
              else resolve(data);
            }
          );
        });
        if (CDKToolkit.Stacks[0].StackStatus === "UPDATE_COMPLETE")
          return CDKToolkit;
        if (CDKToolkit.Stacks[0].StackStatus.endsWith("IN_PROGRESS"))
          send("CDK_INSTALLING");
        // CDK not existing or not found will except out -- so it'll go to install
      },
      deployCDK: async () => {
        // less fantastic -- we need to bootstrap CDK
        // deployment API ritual with CDK shelling out
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
          const child = shell.exec(
            `${CDK} bootstrap --app "${TSNODE} ${CDKSynthesizer}"`,
            { async: true }
          );
          child.once("exit", (code) => {
            if (code) reject(code);
            else resolve();
          });
        });
      },
      // need our package name cleaned, stage name -- those will form the stack name
      // and tags to be passed along
    },
  });
  return (
    <>
      {["checkingCDKToolkit"].includes(state.value.toString()) && (
        <Text>
          <Spinner type="dots" />
        </Text>
      )}
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};
