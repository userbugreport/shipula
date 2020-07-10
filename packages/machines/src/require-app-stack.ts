import { Machine, actions } from "xstate";
import { Info, ShipulaContextProps, ErrorMessage } from "@shipula/context";
import execa from "execa";
import shell from "shelljs";
import fs from "fs-extra";
import path from "path";
import { parseDomain, ParseResultType } from "parse-domain";
import AWS from "aws-sdk";
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
    ready: NoSubState;
  };
}

type Context = ShipulaContextProps & {
  cleanUpFiles?: string[];
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
          if (!shell.which("Docker")) {
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
        onDone: "creating",
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
        onDone: "creating",
        onError: {
          actions: actions.escalate((_context, event) => event.data),
        },
      },
    },
    creating: {
      invoke: {
        src: async (context) => {
          // need an app path
          const CDKSynthesizer = require.resolve("@shipula/server");
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
          // env var to get the stack named before the CDK context is created
          process.env.PACKAGE_FROM = context.package.from;
          process.env.PACKAGE_NAME = context.package.name;
          process.env.STACK_NAME = context.stackName;
          // do we have a prepublish?
          if (context.package.scripts.prepublish)
            process.env.PREPUBLISH = "YES";
          const hostName = parameters.find(
            (p) => path.basename(p.Name) === "SHIPULA_HOST_NAME"
          )?.Value;
          if (hostName) {
            process.env.HOST_NAME = hostName;
            const parsed = parseDomain(process.env.HOST_NAME);
            if (parsed.type === ParseResultType.Listed) {
              const { domain, topLevelDomains } = parsed;
              process.env.DOMAIN_NAME = `${domain}.${topLevelDomains.join(
                "."
              )}`;
              // oh AWS -- zone lookup yet again...
              const route53 = new AWS.Route53();
              const zone = await route53
                .listHostedZonesByName({
                  DNSName: process.env.DOMAIN_NAME,
                })
                .promise();
              // really AWS -- /hostedzone/ ?
              process.env.ZONE_ID = path.basename(zone.HostedZones[0].Id);
              process.env.ZONE_NAME = process.env.DOMAIN_NAME;
              // and we'll need a certificate
              const certificate = (await Info.listShipulaCertificates()).find(
                (c) => c.DomainName === `*.${process.env.DOMAIN_NAME}`
              );
              process.env.CERTIFICATE_ARN = certificate.CertificateArn;
            }
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
