import {
  ShipulaContextProps,
  getStackName,
  Info,
  TaskWithDefinition,
} from "@shipula/context";
import { Machine, actions } from "xstate";
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
    listingStacks: NoSubState;
    describingStack: NoSubState;
    error: NoSubState;
    done: NoSubState;
  };
}

type Events = {
  type: "*";
  data: Error;
};

/**
 * Little bit of context -- error tracking is nice.
 */
type Context = ShipulaContextProps;

/**
 * This is a pretty long query chain that interrogates AWS
 * and figure out an app stack clsuter and running tasks.
 */
export default Machine<Context, Schema, Events>({
  initial: "checkingSettings",
  states: {
    checkingSettings: {
      invoke: {
        src: async (context) => {
          assert(getStackName(context.package.name, context.stackName));
        },
        onDone: "describingStack",
        onError: "listingStacks",
      },
    },
    listingStacks: {
      invoke: {
        src: async (context) => {
          context.stacks = await Info.listShipulaStacks();
        },
        onDone: "done",
        onError: "error",
      },
    },
    describingStack: {
      invoke: {
        src: async (context) => {
          const cloudFormation = new AWS.CloudFormation();
          const stack = (
            await cloudFormation
              .describeStacks({
                StackName: getStackName(
                  context.package.name,
                  context.stackName
                ),
              })
              .promise()
          ).Stacks[0];
          const resources = (
            await cloudFormation
              .describeStackResources({
                StackName: stack.StackId,
              })
              .promise()
          ).StackResources;

          const webClusterDetails = async () => {
            const ecs = new AWS.ECS();
            const webClusterResource = resources.find(
              (r) =>
                r.ResourceType === "AWS::ECS::Cluster" &&
                r.LogicalResourceId.startsWith("WebCluster")
            );

            // read web cluster info, this doesn't apply for static sites
            if (webClusterResource) {
              const webCluster = (
                await ecs
                  .describeClusters({
                    clusters: [webClusterResource.PhysicalResourceId],
                  })
                  .promise()
              ).clusters[0];
              const webClusterServiceArns = (
                await ecs
                  .listServices({ cluster: webCluster.clusterArn })
                  .promise()
              ).serviceArns;
              const webClusterTaskArns = (
                await ecs
                  .listTasks({
                    cluster: webCluster.clusterArn,
                  })
                  .promise()
              ).taskArns;
              const webClusterServices = (
                await ecs
                  .describeServices({
                    services: webClusterServiceArns,
                    cluster: webCluster.clusterArn,
                  })
                  .promise()
              ).services;
              const webClusterTasks = (
                await ecs
                  .describeTasks({
                    tasks: webClusterTaskArns,
                    cluster: webCluster.clusterArn,
                  })
                  .promise()
              ).tasks;
              const webTasksWithDefinitions = await Promise.all(
                webClusterTasks.map(
                  async (webTask): Promise<TaskWithDefinition> => {
                    return {
                      ...webTask,
                      taskDefinition: (
                        await ecs
                          .describeTaskDefinition({
                            taskDefinition: webTask.taskDefinitionArn,
                          })
                          .promise()
                      ).taskDefinition,
                    };
                  }
                )
              );

              const services = webClusterServices.map((service) => ({
                ...service,
                task: webTasksWithDefinitions.find(
                  (wt) => wt.taskDefinitionArn == service.taskDefinition
                ),
              }));
              return { ...webCluster, services };
            } else {
              return null;
            }
          };
          const environment = await Info.listShipulaParameters(
            context.package.name,
            context.stackName
          );

          context.selectedStack = {
            stack,
            resources,
            webCluster: await webClusterDetails(),
            environment,
          };
        },
        onDone: "done",
        onError: "error",
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
