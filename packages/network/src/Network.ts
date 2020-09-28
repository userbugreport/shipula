//import * as backup from "@aws-cdk/aws-backup";
import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";

export class Network extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // this VPC will be shared across all shipula in a Region
    // this is to share IPs against the very low EIP limit
    const vpc = new ec2.Vpc(this, "vpc", {
      maxAzs: 2,
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
      },
    });
    cdk.Tags.of(vpc).add(id, "true");
    const ecr = vpc.addInterfaceEndpoint("EcrEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
    });
    ecr.connections.allowDefaultPortFromAnyIpv4();
    const ecr_docker = vpc.addInterfaceEndpoint("EcrDockerEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    });
    ecr_docker.connections.allowDefaultPortFromAnyIpv4();
    const cloudwatch_logs = vpc.addInterfaceEndpoint("CloudwatchLogsEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });
    cloudwatch_logs.connections.allowDefaultPortFromAnyIpv4();

    // and that is it -- tagged network will be looked up by name from
    // any shipula deploys in this Region
  }
}
