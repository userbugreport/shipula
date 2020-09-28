import * as cdk from "@aws-cdk/core";
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as route53 from "@aws-cdk/aws-route53";
import * as ssm from "@aws-cdk/aws-ssm";

const app = new cdk.App();

interface ShipulaDomainStackProps extends cdk.StackProps {
  domainName: string;
}

class ShipulaDomain extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: ShipulaDomainStackProps) {
    super(parent, name, props);
    const zone = new route53.PublicHostedZone(this, props.domainName, {
      zoneName: props.domainName,
      comment: "Created by Shipula",
    });
    new route53.TxtRecord(this, "shipula", {
      zone,
      values: ["Hello from Shipula!"],
    });
    // certificate must be in us-east-1 for cloudfront
    const wildcardCertificate = new acm.DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        domainName: `*.${props.domainName}`,
        hostedZone: zone,
        region: "us-east-1",
      }
    );
    // store this arn so we can look it up easily
    new ssm.StringParameter(this, "WildcardCertificate", {
      parameterName: `/shipula/${props.domainName}/wildcard`,
      stringValue: wildcardCertificate.certificateArn,
    });
  }
}

const main = async () => {
  const domainName = process.env.DOMAIN_NAME;
  new ShipulaDomain(app, domainName.replace(".", "-"), {
    domainName,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
  app.synth();
};

main();
