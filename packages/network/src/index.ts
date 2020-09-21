import * as cdk from "@aws-cdk/core";
import { Network } from "./Network";
import assert from "assert";
import { ShipulaNetworkName } from "@shipula/context";

const app = new cdk.App();

// pull in from an env var, or just default
const main = async () => {
  const stack = new Network(app, ShipulaNetworkName, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
  assert(stack);
  app.synth();
};

main();
