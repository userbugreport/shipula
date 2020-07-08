import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";

const app = new cdk.App();

// get all parameters
const domainName = process.env.DOMAIN_NAME;

class ShipulaDomain extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props);
    const zone = new route53.PublicHostedZone(this, domainName, {
      zoneName: domainName,
      comment: "Created by Shipula",
    });
    new route53.TxtRecord(this, "shipula", {
      zone,
      values: ["Hello from Shipula!"],
    });
  }
}

const main = async () => {
  new ShipulaDomain(app, domainName.replace(".", "-"), {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
  app.synth();
};

main();
