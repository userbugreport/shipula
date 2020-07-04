import { Machine, actions } from "xstate";
import { ShipulaContextProps, getStackName } from "../context";
import shell from "shelljs";
import docs from "../docs";
import fs from "fs-extra";
import path from "path";
import appRoot from "app-root-path";

const dockerFrom = path.resolve(
  __dirname,
  "..",
  "aws",
  "node-image",
  "Dockerfile"
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    checkingForDocker: NoSubState;
    checkingForDockerfile: NoSubState;
    creatingDockerfile: NoSubState;
    creating: NoSubState;
    cleaningUp: NoSubState;
    ready: NoSubState;
  };
}

type Context = ShipulaContextProps;

type Events = never;

/**
 * We will need an ECR in order to store our containers to deploy on ECS.
 */
export default Machine<Context, Schema, Events>({
  id: "appstack",
  initial: "checkingForDocker",
  states: {
    checkingForDocker: {
      invoke: {
        src: async () => {
          if (!shell.which("Docker")) {
            throw new Error(docs("docker.md"));
          }
        },
        onDone: "checkingForDockerfile",
        onError: {
          actions: actions.escalate((_context, event) => event.data),
        },
      },
    },
    checkingForDockerfile: {
      invoke: {
        src: async (context) => {
          const exists = await fs.pathExists(
            path.join(context.package.from, "Dockerfile")
          );
          if (exists) return true;
          else throw new Error("Missing Dockerfile");
        },
        onDone: "creating",
        onError: "creatingDockerfile",
      },
    },
    creatingDockerfile: {
      invoke: {
        src: async (context) => {
          const dockerTo = path.resolve(context.package.from, "Dockerfile");
          fs.copyFile(dockerFrom, dockerTo);
        },
        onDone: "creating",
        onError: {
          actions: actions.escalate((_context, event) => event.data),
        },
      },
    },
    creating: {
      invoke: {
        src: async (context) => {
          await new Promise((resolve, reject) => {
            // need an app path
            const CDKSynthesizer = path.resolve(
              __dirname,
              "..",
              "aws",
              "index"
            );
            const CDK = path.resolve(
              appRoot.path,
              "node_modules",
              ".bin",
              "cdk"
            );
            const TSNODE = path.resolve(
              appRoot.path,
              "node_modules",
              ".bin",
              "ts-node"
            );
            const TAGS = `--tags packageName=${context.package.name} --tags stackName=${context.stackName}`;
            const CONTEXT = `--context PACKAGE_FROM=${context.package.from} --context PACKAGE=${context.package.name} --context STACK=${context.stackName}`;
            process.env.STACK_NAME = getStackName(context);
            const child = shell.exec(
              `${CDK} deploy --require-approval never ${CONTEXT} ${TAGS} --app "${TSNODE} ${CDKSynthesizer}"`,
              { async: true }
            );
            child.once("exit", (code) => {
              if (code) reject(code);
              else resolve();
            });
          });
        },
        onDone: "cleaningUp",
        onError: {
          actions: actions.escalate((_context, event) => event.data),
        },
      },
    },
    cleaningUp: {
      invoke: {
        src: async (context) => {
          // if the Docker file is -- our template we put there -- delete it
          if (context.cleanUpFiles?.length) {
            return Promise.all(
              context.cleanUpFiles.map((fileName) => fs.remove(fileName))
            );
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
