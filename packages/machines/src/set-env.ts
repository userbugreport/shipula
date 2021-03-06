import { ShipulaContextProps, getStackPath } from "@shipula/context";
import { Machine, actions } from "xstate";
import deployStack from "./deploy-stack";
import infoStack from "./info-stack";
import AWS from "aws-sdk";
import assert from "assert";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

/**
 * The states of the state machine, listed out here for TypeScript.
 */
interface Schema {
  states: {
    checkingSettings: NoSubState;
    checkingStack: NoSubState;
    setParameters: NoSubState;
    maybeDeploying: NoSubState;
    restarting: NoSubState;
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
type Context = ShipulaContextProps & {
  messages?: string[];
};

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
          assert(getStackPath(context.package?.name, context.stackName));
        },
        onDone: "setParameters",
        onError: "error",
      },
    },
    setParameters: {
      invoke: {
        src: async (context) => {
          const ssm = new AWS.SSM();
          const waitfor = Object.keys(context.setVariables || {}).map(
            (name) => {
              return ssm
                .putParameter({
                  Name: path.join(
                    "/",
                    getStackPath(context.package.name, context.stackName),
                    name
                  ),
                  Value: context.setVariables[name],
                  Overwrite: true,
                  Type: "String",
                })
                .promise();
            }
          );
          await Promise.all(waitfor);
        },
        onDone: "maybeDeploying",
        onError: "error",
      },
    },
    maybeDeploying: {
      invoke: {
        src: deployStack,
        data: (context) => context,
        onDone: "checkingStack",
        onError: "error",
      },
    },
    checkingStack: {
      invoke: {
        src: infoStack,
        data: (context) => context,
        onDone: "restarting",
        onError: "error",
      },
    },
    restarting: {
      invoke: {
        src: async (context) => {
          const ecs = new AWS.ECS();
          const webServices = context?.selectedStack?.webCluster.services || [];
          const waitfor = webServices.map(async (service) => {
            return ecs
              .updateService({
                cluster: context.selectedStack.webCluster.clusterArn,
                service: service.serviceArn,
                forceNewDeployment: true,
              })
              .promise();
          });
          await Promise.all(waitfor);
          // and let them get stable so we can see our variable...
          if (webServices.length) {
            await ecs
              .waitFor("servicesStable", {
                cluster: context.selectedStack.webCluster.clusterArn,
                services: webServices.map((w) => w.serviceArn),
              })
              .promise();
          }
        },
        onDone: "done",
        onError: "error",
      },
    },
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
