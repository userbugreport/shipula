import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as route53 from "@aws-cdk/aws-route53";
import * as targets from "@aws-cdk/aws-route53-targets";
import assert from "assert";
import { getStackName } from "@shipula/context";
import path from "path";

const app = new cdk.App();

// get all parameters
const packageName = process.env.PACKAGE_NAME;
const packageFrom = process.env.PACKAGE_FROM;
const stackName = process.env.STACK_NAME;
const hostName = process.env.HOST_NAME;
const domainName = process.env.DOMAIN_NAME;

class ShipulaStatic extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props);
    // need to put the files -- somewhere
    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      bucketName: name,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "404.html",
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    new cdk.CfnOutput(this, "Bucket", {
      value: siteBucket.bucketName,
    });

    // DNS anyone ?
    const zone = domainName
      ? route53.HostedZone.fromLookup(this, "Zone", {
          domainName: domainName,
        })
      : undefined;
    // certificate must be in us-east-1 -- so make one...
    const certificateArn =
      zone && hostName
        ? new acm.DnsValidatedCertificate(this, "SiteCertificate", {
            domainName: hostName,
            hostedZone: zone,
            region: "us-east-1", // Cloudfront only checks this region for certificates.
          }).certificateArn
        : undefined;
    // depending on the settings -- build an alias for a custom
    // domain name
    const aliasConfiguration = () => {
      if (hostName && certificateArn) {
        return {
          acmCertRef: certificateArn,
          names: [hostName],
          sslMethod: cloudfront.SSLMethod.SNI,
          securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
        };
      } else {
        return undefined;
      }
    };

    // tell cloudfront to distribute out s3 bucket
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "SiteDistribution",
      {
        aliasConfiguration: aliasConfiguration(),
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: siteBucket,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    // and a custom name in Route53 pointing to CloudFront
    if (zone && process.env.HOST_NAME) {
      new route53.ARecord(this, "SiteAliasRecord", {
        recordName: process.env.HOST_NAME,
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution)
        ),
        zone,
      });
      // fancy http custom domain name alias for the distribution
      new cdk.CfnOutput(this, "Https", {
        value: `https://${hostName}`,
      });
    } else {
      new cdk.CfnOutput(this, "Http", {
        // raw static http name for the distribution
        value: `http://${distribution.domainName}`,
      });
    }

    // Deploy site contents to S3 bucket -- this actually copies files
    const buildFilesIn = path.join(packageFrom, "build");
    new s3deploy.BucketDeployment(this, "DeployWithInvalidation", {
      sources: [s3deploy.Source.asset(buildFilesIn)],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}

// pull in from an env var, or just default
const main = async () => {
  const id = getStackName(packageName, stackName);
  const stack = new ShipulaStatic(app, id, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
  assert(stack);
  app.synth();
};

main();
