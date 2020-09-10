import { Machine, actions } from "xstate";
import {
  Info,
  ShipulaContextProps,
  ErrorMessage,
  setShipulaEnvironmentForCDK,
} from "@shipula/context";
import execa from "execa";
import shell from "shelljs";
import fs from "fs-extra";
import path from "path";
import { CDK } from "./cdk";

const dockerFrom = path.resolve(
  __dirname,
  "..",
  "dockerfiles",
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
    maybeBuilding: NoSubState;
    ready: NoSubState;
  };
}

export type Context = ShipulaContextProps & {
  cleanUpFiles?: string[];
  deployStyle: "@shipula/static" | "@shipula/server";
};

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
          if (!shell.which("docker")) {
            throw new ErrorMessage(
              "You need [Docker](https://docs.docker.com/get-docker/) installed."
            );
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
          else throw new ErrorMessage("Missing Dockerfile");
        },
        onDone: "maybeBuilding",
        onError: "creatingDockerfile",
      },
    },
    creatingDockerfile: {
      invoke: {
        src: async (context) => {
          const dockerTo = path.resolve(context.package.from, "Dockerfile");
          context.cleanUpFiles = [dockerTo];
          return fs.copyFile(dockerFrom, dockerTo);
        },
        onDone: "maybeBuilding",
        onError: {
          actions: actions.escalate((_context, event) => event.data),
        },
      },
    },
    maybeBuilding: {
      invoke: {
        src: async (context) => {
          if (context.deployStyle === "@shipula/static") {
            const child = execa.sync("yarn", ["build"], {
              stdio: "inherit",
              cwd: context.package.from,
            });
            if (child.exitCode) {
              throw new ErrorMessage(`Exit ${child.exitCode}`);
            }
          }
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
          // depending on the depoyment styles...
          const CDKSynthesizer = require.resolve(context.deployStyle);
          const TAGS = [
            "--tags",
            `createdBy=shipula`,
            "--tags",
            `packageName=${context.package.name}`,
            "--tags",
            `packageVersion=${context.package.version}`,
            "--tags",
            `stackName=${context.stackName}`,
          ];
          const CONTEXT = [];
          const parameters = await Info.listShipulaParameters(
            context.package.name,
            context.stackName
          );
          setShipulaEnvironmentForCDK(context);
          const hostName = parameters.find(
            (p) => path.basename(p.Name) === "SHIPULA_HOST_NAME"
          )?.Value;
          if (hostName) {
            process.env.HOST_NAME = hostName;
            process.env.DOMAIN_NAME = Info.domainName(hostName);
          }
          //
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
          // if the Docker file is -- our template we put there -- delete it
          return Promise.all(
            context.cleanUpFiles?.map((fileName) => {
              console.log(`Cleaning up ${fileName}`);
              return fs.remove(fileName);
            }) || []
          );
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
