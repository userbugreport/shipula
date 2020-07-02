import { Port, SecurityGroup, Vpc } from "@aws-cdk/aws-ec2";
import { Cluster } from "@aws-cdk/aws-ecs";
import { FileSystem } from "@aws-cdk/aws-efs";
import { Construct, Stack, StackProps } from "@aws-cdk/core";
import { AmazonEfsAccessPoints } from "./AmazonEfsAccessPoints";
import { AmazonEfsFileSystemPolicy } from "./AmazonEfsFileSystemPolicy";
import {
  AmazonEcsEfsIntegrationService,
  ServiceType,
} from "./AmazonEcsService";
import { ApplicationLoadBalancedFargateService } from "@aws-cdk/aws-ecs-patterns";

/**
 * Props to pass in from the command line to be stored and passed along here.
 */
export interface AmazonEfsIntegrationsStackProps extends StackProps {
  cpuSize: string;
  memorySize: string;
}

export class AmazonEfsIntegrationsStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: AmazonEfsIntegrationsStackProps
  ) {
    super(scope, id, props);

    // isolation -- each package and stage gets a unique VPC, this should
    // help folks feel more secure
    const vpc = new Vpc(this, `${id}-vpc`, { maxAzs: 2 });

    const cluster = new Cluster(this, `${id}-ecs`, { vpc });

    // file system, with security and an access point
    const efsSecurityGroup = new SecurityGroup(
      this,
      `${id}-efs-security-group`,
      {
        securityGroupName: `${id}-efs-security-group`,
        vpc,
      }
    );
    const fileSystem = new FileSystem(this, `${id}-efs`, {
      encrypted: true,
      fileSystemName: `${id}-efs`,
      securityGroup: efsSecurityGroup,
      vpc,
    });
    const efsAccessPoints = new AmazonEfsAccessPoints(fileSystem);

    const ecsOnFargateService = AmazonEcsEfsIntegrationService.create(
      ServiceType.FARGATE,
      cluster,
      fileSystem,
      efsAccessPoints
    ) as ApplicationLoadBalancedFargateService;
    efsSecurityGroup.connections.allowFrom(
      ecsOnFargateService.service,
      Port.tcp(2049)
    );

    // tslint:disable-next-line: no-unused-expression
    new AmazonEfsFileSystemPolicy(
      fileSystem,
      `${id}-efs-policy`,
      efsAccessPoints,
      ecsOnFargateService
    );
  }
}
