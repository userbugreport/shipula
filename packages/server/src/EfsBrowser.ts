//import * as backup from "@aws-cdk/aws-backup";
import * as cdk from "@aws-cdk/core";
import * as ecs from "@aws-cdk/aws-ecs";
import * as logs from "@aws-cdk/aws-logs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as efs from "@aws-cdk/aws-efs";

export class EfsBrowser extends cdk.Construct {
  constructor(
    stack: cdk.Stack,
    id: string,
    ecsCluster: ecs.Cluster,
    fileSystem: efs.FileSystem,
    logGroup: logs.LogGroup
  ) {
    id = `${id}-EFSBrowser`;
    super(stack, id);

    const taskDef = new ecs.FargateTaskDefinition(stack, "EFSBrowserTask", {
      memoryLimitMiB: 512,
      cpu: 256,
      // avoid guid trash names
      family: `${id}-Task`,
    });
    // hook on EFS
    taskDef.addVolume({
      name: "ClusterShared",
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
        rootDirectory: "/",
        transitEncryption: "ENABLED",
      },
    });

    // cloud watch logs
    const logging = new ecs.AwsLogDriver({
      streamPrefix: `console`,
      logGroup,
    });

    const containerDef = new ecs.ContainerDefinition(
      stack,
      "EFSBrowserContainer",
      {
        image: ecs.ContainerImage.fromRegistry("coderaiser/cloudcmd"),
        logging: logging,
        taskDefinition: taskDef,
        environment: {
          PORT: "8000",
        },
      }
    );

    // oh yes, this is the port
    containerDef.addPortMappings({
      containerPort: 8000,
    });

    // mount EFS
    containerDef.addMountPoints({
      containerPath: "/cluster_shared",
      readOnly: false,
      sourceVolume: "ClusterShared",
    });

    new ecs_patterns.ApplicationLoadBalancedFargateService(
      stack,
      "EFSBrowserService",
      {
        serviceName: "EFSBrowserService",
        cluster: ecsCluster,
        taskDefinition: taskDef,
        desiredCount: 1,
        platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      }
    );
  }
}
