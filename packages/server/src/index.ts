import * as cdk from "@aws-cdk/core";
import { FargateEfs } from "./FargateEfs";
import assert from "assert";
import { getStackName, Info } from "@shipula/context";

const app = new cdk.App();

// get all parameters
const packageName = process.env.PACKAGE_NAME;
const packageFrom = process.env.PACKAGE_FROM;
const stackName = process.env.STACK_NAME;

// pull in from an env var, or just default
const main = async () => {
  const parameters = await Info.listShipulaParameters(packageName, stackName);
  const id = getStackName(packageName, stackName);
  const stack = new FargateEfs(
    app,
    id,
    packageFrom,
    packageName,
    stackName,
    parameters,
    {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    }
  );
  assert(stack);
  app.synth();
};

main();
