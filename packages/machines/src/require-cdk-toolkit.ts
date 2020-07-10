import { Machine, actions } from "xstate";
import AWS, { CloudFormation } from "aws-sdk";
import { ShipulaContextProps, getStackName } from "@shipula/context";
import { CDK } from "./cdk";
import execa from "execa";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    checking: NoSubState;
    waiting: NoSubState;
    creating: NoSubState;
    ready: NoSubState;
  };
}

type Context = ShipulaContextProps;

type Events = {
  type: "IN_PROGRESS";
};

/**
 * CDK needs a toolkit stack.
 */
export default Machine<Context, Schema, Events>({
  id: "cdktoolkit",
  initial: "checking",
  states: {
    checking: {
      on: {
        IN_PROGRESS: "waiting",
      },
      invoke: {
        src: async () => {
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
          if (
            ["UPDATE_COMPLETE", "CREATE_COMPLETE"].includes(
              CDKToolkit.Stacks[0].StackStatus
            )
          ) {
            return CDKToolkit;
          } else if (CDKToolkit.Stacks[0].StackStatus.endsWith("IN_PROGRESS")) {
            actions.send("IN_PROGRESS");
          } else {
            // CDK not existing or not found will except out -- so it'll go to install
            throw new Error("CDKToolkit not found");
          }
        },
        onDone: "ready",
        onError: "creating",
      },
    },
    waiting: {
      after: {
        1000: "checking",
      },
    },
    creating: {
      invoke: {
        src: async (context) => {
          await new Promise((resolve, reject) => {
            // need an app path
            const CDKSynthesizer = require.resolve("@shipula/server");

            // env var to get the stack named before the CDK context is created
            process.env.STACK_NAME = getStackName(
              context.package.name,
              context.stackName
            );
            const CONTEXT = [
              "--context",
              `PACKAGE_FROM=${context.package.from}`,
              "--context",
              `PACKAGE=${context.package.name}`,
              "--context",
              `STACK=${context.stackName}`,
            ];
            const child = execa.sync(
              CDK,
              ["bootstrap", "--app", CDKSynthesizer, ...CONTEXT],
              { stdio: "inherit" }
            );
            if (child.exitCode) reject(child.exitCode);
            else resolve();
          });
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
