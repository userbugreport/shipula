import * as backup from "@aws-cdk/aws-backup";
import * as acm from "@aws-cdk/aws-certificatemanager";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";
import * as ssm from "@aws-cdk/aws-ssm";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as alb from "@aws-cdk/aws-elasticloadbalancingv2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as logs from "@aws-cdk/aws-logs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as efs from "@aws-cdk/aws-efs";
import * as cr from "@aws-cdk/custom-resources";
import { FargateEfsCustomResource } from "./FargateEfsCustomResource";
import { RetentionDays } from "@aws-cdk/aws-logs";
import { RemovalPolicy } from "@aws-cdk/core";
import AWS from "aws-sdk";
import { getStackPath } from "@shipula/context";
import path from "path";

export class FargateEfs extends cdk.Stack {
  constructor(
    scope: cdk.App,
    id: string,
    packageFrom: string,
    packageName: string,
    stackName: string,
    parameters: AWS.SSM.ParameterList,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);
    const hostName = process.env.HOST_NAME;
    const domainName = process.env.DOMAIN_NAME;

    // used to read parameters
    const parameterOrDefault = (
      parameterName: string,
      defaultValue: string
    ) => {
      // see if this is defined -- CDK throws an error that I cannot
      // seem to try/catch when asking for parameters that don't exist
      // I think it is related to the two-pass approach to synth and execution
      const defined = parameters.find(
        (p) => path.basename(p.Name) === parameterName
      );
      if (defined) {
        return ssm.StringParameter.valueFromLookup(
          this,
          path.join("/", getStackPath(packageName, stackName), parameterName)
        );
      } else {
        return defaultValue;
      }
    };

    // DNS anyone ?
    const domainZone = domainName
      ? route53.HostedZone.fromLookup(this, "Zone", {
          domainName: domainName,
        })
      : undefined;
    // remember that -- AWS uses domain name to mean host name
    const certificate =
      domainZone && hostName
        ? new acm.DnsValidatedCertificate(this, "SiteCertificate", {
            domainName: hostName,
            hostedZone: domainZone,
          })
        : undefined;

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
      removalPolicy: RemovalPolicy.DESTROY,
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
      allowRestores: true,
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
      memoryLimitMiB: parseInt(parameterOrDefault("SHIPULA_MEMORY", "2048")),
      cpu: parseInt(parameterOrDefault("SHIPULA_CPU", "1024")),
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
      image: ecs.ContainerImage.fromAsset(packageFrom, {
        buildArgs: {
          PREPUBLISH: process.env.PREPUBLISH,
        },
      }),
      logging: logging,
      taskDefinition: taskDef,
      environment: {
        PORT: "8000",
      },
      secrets,
    });

    // oh yes, this is the port
    containerDef.addPortMappings({
      containerPort: 8000,
    });

    // if all the stars are aligned -- then we get https
    const protocol =
      domainZone && certificate && hostName
        ? alb.ApplicationProtocol.HTTPS
        : alb.ApplicationProtocol.HTTP;

    const albFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "WebService",
      {
        serviceName: "WebService",
        cluster: ecsCluster,
        taskDefinition: taskDef,
        desiredCount: parseInt(parameterOrDefault("SHIPULA_NUMBER", "2")),
        platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
        domainZone,
        certificate,
        // AWS -- calls host domain name...
        domainName: hostName,
        protocol,
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
