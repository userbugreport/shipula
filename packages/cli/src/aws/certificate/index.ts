import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";
import * as acm from "@aws-cdk/aws-certificatemanager";

const app = new cdk.App();

// get all parameters
const domainName = process.env.DOMAIN_NAME;

class ShipulaCertificate extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props);
    const zone = route53.PublicHostedZone.fromLookup(this, "domain", {
      domainName: domainName,
    });
    new acm.DnsValidatedCertificate(this, "certificate", {
      domainName: `*.${domainName}`,
      hostedZone: zone,
      validationMethod: acm.ValidationMethod.DNS,
    });
  }
}

const main = async () => {
  new ShipulaCertificate(app, `${domainName.replace(".", "-")}-certificate`, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
  app.synth();
};

main();
