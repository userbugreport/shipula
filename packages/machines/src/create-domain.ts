import { Machine, actions } from "xstate";
import { ShipulaContextProps } from "@shipula/context";
import AWS from "aws-sdk";
import path from "path";
import execa from "execa";
import { CDK } from "./cdk";
import dns from "dns";

const PollInterval = 1000;

const messages = [
  "Enter these name servers into your domain name provider.",
  "Shipula will check this for you and proceed.",
  "DNS can take a minutes to hours to update, so be patient.",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    checkingParameters: NoSubState;
    creatingDomain: NoSubState;
    displaying: NoSubState;
    checking: NoSubState;
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
   * Ohh, AWS -- two names for everything.
   */
  zoneId?: string;
  /**
   * Test DNS.
   */
  testDNS?: string[];
};

/**
 * Transtion ye olde state machine
 */
type Events = { data?: Error } & { type: "*" };

const deployCDK = async (context: Context, runPath: string): Promise<void> => {
  const CONTEXT = [];
  // env var to get the stack named before the CDK context is created
  process.env.DOMAIN_NAME = context.domainName;
  const child = execa.sync(
    CDK,
    ["deploy", "--require-approval", "never", "--app", runPath, ...CONTEXT],
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
  id: "create-domain",
  initial: "checkingParameters",
  states: {
    checkingParameters: {
      always: [
        {
          cond: (context) => context?.domainName?.length > 0,
          target: "creatingDomain",
        },
        {
          cond: (context) => (context?.domainName || "").length === 0,
          target: "done",
        },
      ],
    },
    creatingDomain: {
      invoke: {
        src: async (context) => {
          // need an app path
          const CDKSynthesizer = require.resolve("@shipula/domain");
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
          context.messages = [
            ...messages,
            ...hostedZone.DelegationSet.NameServers,
          ];
        },
        onDone: "checking",
        onError: "error",
      },
    },
    checking: {
      always: [
        {
          cond: (context) => {
            const properAnswer = context.testDNS?.find((r) =>
              r.toLowerCase().includes("shipula")
            );
            if (properAnswer) {
              context.messages = [...context.messages, " ✅ Domain verified."];
              return true;
            } else {
              return false;
            }
          },
          target: "done",
        },
      ],
      invoke: {
        src: async (context) => {
          const answer = await new Promise<string[]>((resolve, reject) => {
            dns.resolveTxt(context.domainName, (err, records) => {
              if (err) reject(err);
              else resolve(records.flat());
            });
          });
          context.testDNS = answer;
        },
        onDone: "working",
        onError: "working",
      },
    },
    working: {
      entry: actions.assign({
        lastError: (_context, event) => event?.data,
      }),
      after: {
        [PollInterval]: "checking",
      },
    },
    error: {
      entry: actions.assign({
        lastError: (_context, event) => event?.data,
      }),
    },
    done: { type: "final" },
  },
});
