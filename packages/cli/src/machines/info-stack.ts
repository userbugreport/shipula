import { ShipulaContextProps, getStackName } from "../context";
import { Machine, actions } from "xstate";
import { listShipulaStacks } from "../aws/info";
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
          const cloudFormation = new AWS.CloudFormation();
          const stack = (
            await cloudFormation
              .describeStacks({
                StackName: getStackName(context),
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

          const ecs = new AWS.ECS();
          const webClusterResource = resources.find(
            (r) =>
              r.ResourceType === "AWS::ECS::Cluster" &&
              r.LogicalResourceId.startsWith("WebCluster")
          );

          const webCluster = (
            await ecs
              .describeClusters({
                clusters: [webClusterResource.PhysicalResourceId],
              })
              .promise()
          ).clusters[0];
          const webClusterTaskArns = (
            await ecs
              .listTasks({
                cluster: webCluster.clusterArn,
              })
              .promise()
          ).taskArns;
          const webTasks = (
            await ecs
              .describeTasks({
                tasks: webClusterTaskArns,
                cluster: webCluster.clusterArn,
              })
              .promise()
          ).tasks;
          const webTaskDefinition = (
            await ecs
              .describeTaskDefinition({
                taskDefinition: webTasks[0].taskDefinitionArn,
              })
              .promise()
          ).taskDefinition;

          context.selectedStack = {
            stack,
            resources,
            webCluster,
            webTasks,
            webTaskDefinition,
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
