import { Machine, actions } from "xstate";
import { ShipulaContextProps } from "../context";
import AWS from "aws-sdk";
import path from "path";
import appRoot from "app-root-path";
import execa from "execa";

const PollInterval = 5000;

const messages = [
  "Enter these name servers into your domain name provider.",
  "Shipula will check this for you and proceed.",
  "DNS can take a minutes to hours to update, so be patient.",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    creatingDomain: NoSubState;
    displaying: NoSubState;
    checking: NoSubState;
    creatingCertificate: NoSubState;
    working: NoSubState;
    error: NoSubState;
    done: NoSubState;
  };
}

type Context = ShipulaContextProps & {
  /**
   * Messages to pass to the UI.
   */
  messages?: string[];
  /**
   * Once a domain is created, these are the name servers
   * that need to be place in your provider.
   */
  nameServers?: string[];
  /**
   * Ohh, AWS -- two names for everything.
   */
  zoneId?: string;
  /**
   * Test DNS.
   */
  testDNS?: AWS.Route53.TestDNSAnswerResponse;
};

/**
 * Transtion ye olde state machine
 */
type Events = { data?: Error } & { type: "*" };

const deployCDK = async (context: Context, runPath: string): Promise<void> => {
  const CDK = path.resolve(appRoot.path, "node_modules", ".bin", "cdk");
  const TSNODE = path.resolve(appRoot.path, "node_modules", ".bin", "ts-node");
  const CONTEXT = [];
  // env var to get the stack named before the CDK context is created
  process.env.DOMAIN_NAME = context.domainName;
  const child = execa.sync(
    CDK,
    [
      "deploy",
      "--require-approval",
      "never",
      "--app",
      `${TSNODE} ${runPath}`,
      ...CONTEXT,
    ],
    {
      stdio: "inherit",
    }
  );
  if (child.exitCode) throw new Error();
};

/**
 * CDK needs a toolkit stack.
 */
export default Machine<Context, Schema, Events>({
  initial: "creatingDomain",
  states: {
    creatingDomain: {
      invoke: {
        src: async (context) => {
          // need an app path
          const CDKSynthesizer = path.resolve(
            __dirname,
            "..",
            "aws",
            "domain",
            "index"
          );
          await deployCDK(context, CDKSynthesizer);
        },
        onDone: "displaying",
        onError: "error",
      },
    },
    displaying: {
      invoke: {
        src: async (context) => {
          const route53 = new AWS.Route53();
          const zone = await route53
            .listHostedZonesByName({
              DNSName: context.domainName,
            })
            .promise();
          // really AWS -- /hostedzone/ ?
          context.zoneId = path.basename(zone.HostedZones[0].Id);
          const hostedZone = await route53
            .getHostedZone({
              Id: context.zoneId,
            })
            .promise();
          context.nameServers = hostedZone.DelegationSet.NameServers;
          context.messages = messages;
        },
        onDone: "checking",
        onError: "error",
      },
    },
    checking: {
      always: [
        {
          cond: (context) => context.testDNS?.ResponseCode === "NOERROR",
          target: "creatingCertificate",
        },
      ],
      invoke: {
        src: async (context) => {
          const route53 = new AWS.Route53();
          const answer = await route53
            .testDNSAnswer({
              HostedZoneId: context.zoneId,
              RecordName: "starphleet.com",
              RecordType: "TXT",
            })
            .promise();
          context.testDNS = answer;
        },
        onDone: "working",
        onError: "error",
      },
    },
    creatingCertificate: {
      invoke: {
        src: async (context) => {
          // need an app path
          const CDKSynthesizer = path.resolve(
            __dirname,
            "..",
            "aws",
            "certificate",
            "index"
          );
          await deployCDK(context, CDKSynthesizer);
        },
        onDone: "done",
        onError: "error",
      },
    },
    working: {
      after: {
        [PollInterval]: "checking",
      },
    },
    error: {
      type: "final",
      entry: actions.assign({
        lastError: (_context, event) => event?.data,
      }),
    },
    done: { type: "final" },
  },
});
