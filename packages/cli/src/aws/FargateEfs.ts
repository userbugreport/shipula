import * as backup from "@aws-cdk/aws-backup";
import * as cdk from "@aws-cdk/core";
import * as ssm from "@aws-cdk/aws-ssm";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as logs from "@aws-cdk/aws-logs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as efs from "@aws-cdk/aws-efs";
import * as cr from "@aws-cdk/custom-resources";
import { FargateEfsCustomResource } from "./FargateEfsCustomResource";
import { RetentionDays } from "@aws-cdk/aws-logs";
import { RemovalPolicy } from "@aws-cdk/core";
import { getStackPath, getStackName, getInternalPath } from "../context";
import path from "path";

export class FargateEfs extends cdk.Stack {
  constructor(
    scope: cdk.App,
    packageFrom: string,
    packageName: string,
    stackName: string,
    parameters: AWS.SSM.ParameterList,
    props?: cdk.StackProps
  ) {
    // build a name cloud formation will accept
    const id = getStackName(packageName, stackName);
    super(scope, id, props);
    const parameterOrDefault = (
      parameterName: string,
      defaultValue: string
    ) => {
      return (
        ssm.StringParameter.valueFromLookup(
          this,
          path.join("/", getInternalPath(packageName, stackName), parameterName)
        ) || defaultValue
      );
    };

    const vpc = new ec2.Vpc(this, "vpc", { maxAzs: 2 });
    const ecsCluster = new ecs.Cluster(this, "WebCluster", {
      vpc: vpc,
      // use a name without guidtrash
      clusterName: id,
    });

    const fileSystem = new efs.FileSystem(this, "Efs", {
      vpc: vpc,
      encrypted: true,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_90_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
    });

    // auto backup the file system
    const vault = new backup.BackupVault(this, "Backup", {
      backupVaultName: id,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const plan = new backup.BackupPlan(this, "BackupPlan", {
      backupPlanName: id,
    });
    plan.addSelection("Efs", {
      resources: [backup.BackupResource.fromConstruct(fileSystem)],
    });
    plan.addRule(backup.BackupPlanRule.daily(vault));

    const params = {
      FileSystemId: fileSystem.fileSystemId,
      PosixUser: {
        Gid: 1000,
        Uid: 1000,
      },
      RootDirectory: {
        CreationInfo: {
          OwnerGid: 1000,
          OwnerUid: 1000,
          Permissions: "755",
        },
        Path: "/cluster_shared",
      },
      Tags: [
        {
          Key: "Name",
          Value: "ecsuploads",
        },
      ],
    };

    const efsAccessPoint = new cr.AwsCustomResource(this, "EfsAccessPoint", {
      onUpdate: {
        service: "EFS",
        action: "createAccessPoint",
        parameters: params,
        physicalResourceId: cr.PhysicalResourceId.of("12121212121"),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    efsAccessPoint.node.addDependency(fileSystem);

    const taskDef = new ecs.FargateTaskDefinition(this, "WebTask", {
      memoryLimitMiB: parseInt(parameterOrDefault("memory", "2048")),
      cpu: parseInt(parameterOrDefault("cpu", "1024")),
      // avoid guid trash names
      family: `${id}-WebTask`,
    });

    // cloud watch logs
    const logGroupName = getStackPath(packageName, stackName);
    const logGroup = new logs.LogGroup(this, "LogGroup", {
      logGroupName,
      retention: RetentionDays.INFINITE,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const logging = new ecs.AwsLogDriver({
      streamPrefix: `console`,
      logGroup,
    });

    // need a relative path to the dockerfile
    const secrets = Object.fromEntries(
      parameters.map((p) => [
        path.basename(p.Name),
        // this one is quite the doozy to import existing parameters
        // so we can manage parameters separately from deploys
        ecs.Secret.fromSsmParameter(
          ssm.StringParameter.fromStringParameterName(
            this,
            path.basename(p.Name),
            p.Name
          )
        ),
      ])
    );
    const containerDef = new ecs.ContainerDefinition(this, "WebContainer", {
      image: ecs.ContainerImage.fromAsset(packageFrom),
      logging: logging,
      taskDefinition: taskDef,
      environment: {
        PORT: "8000",
      },
      secrets,
    });

    containerDef.addPortMappings({
      containerPort: 8000,
    });

    const albFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "WebService",
      {
        serviceName: "WebService",
        cluster: ecsCluster,
        taskDefinition: taskDef,
        desiredCount: parseInt(parameterOrDefault("number", "2")),
        platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      }
    );

    albFargateService.targetGroup.setAttribute(
      "deregistration_delay.timeout_seconds",
      "30"
    );

    // Allow access to EFS from Fargate ECS
    fileSystem.connections.allowDefaultPortFrom(
      albFargateService.service.connections
    );

    //Custom Resource to add EFS Mount to Task Definition
    const resource = new FargateEfsCustomResource(
      this,
      "FargateEfsCustomResource",
      {
        TaskDefinition: taskDef.taskDefinitionArn,
        EcsService: albFargateService.service.serviceName,
        EcsCluster: ecsCluster.clusterName,
        EfsFileSystemId: fileSystem.fileSystemId,
        EfsMountName: "cluster_shared",
      }
    );

    resource.node.addDependency(albFargateService);
  }
}
