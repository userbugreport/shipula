import {
  CfnService,
  ContainerImage,
  Cluster,
  NetworkMode,
  FargatePlatformVersion,
} from "@aws-cdk/aws-ecs";
import { FileSystem } from "@aws-cdk/aws-efs";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "@aws-cdk/custom-resources";
import { AmazonEfsAccessPoints } from "./AmazonEfsAccessPoints";
import {
  ApplicationLoadBalancedFargateService,
  ApplicationLoadBalancedFargateServiceProps,
} from "@aws-cdk/aws-ecs-patterns";

export enum ServiceType {
  EC2 = "Ec2",
  FARGATE = "Fargate",
}

interface MountPoint {
  containerPath: string;
  sourceVolume: string;
}

interface Volume {
  name: string;
  efsVolumeConfiguration?: {
    fileSystemId: string;
    authorizationConfig?: {
      iam: string;
      accessPointId: string;
    };
    transitEncryption: string;
  };
}

export class AmazonEcsEfsIntegrationService {
  static create(
    serviceType: ServiceType,
    cluster: Cluster,
    fileSystem?: FileSystem,
    efsAccessPoints?: AmazonEfsAccessPoints,
    props?: ApplicationLoadBalancedFargateServiceProps
  ): ApplicationLoadBalancedFargateService {
    //TODO -- image!
    const containerImage = "coderaiser/cloudcmd:14.3.10-alpine";
    const service = new ApplicationLoadBalancedFargateService(
      cluster.stack,
      "FargateService",
      {
        cluster,
        desiredCount: 2,
        platformVersion: FargatePlatformVersion.VERSION1_4,
        taskImageOptions: {
          image: ContainerImage.fromRegistry(containerImage),
        },
        ...props,
      }
    );

    // mount all the EFS access points
    const mountPoints: MountPoint[] = [];
    const volumes: Volume[] = [];
    efsAccessPoints.forEach((ap: AwsCustomResource, name: string) => {
      const containerPath = `/${name}`;

      mountPoints.push({ containerPath, sourceVolume: name });
      volumes.push({
        name,
        efsVolumeConfiguration: {
          fileSystemId: fileSystem.fileSystemId,
          authorizationConfig: {
            iam: "ENABLED",
            accessPointId: ap.getResponseField("AccessPointId"),
          },
          transitEncryption: "ENABLED",
        },
      });
    });

    /*
      This JSON structure represents the final desired task definition, which includes the
      EFS volume configurations. This is a stop-gap measure that will be replaced when this
      capability is fully supported in CloudFormation and CDK.
    */
    const customTaskDefinitionJson = {
      containerDefinitions: [
        {
          command: [
            "--no-keys-panel",
            "--one-file-panel",
            "--port=80",
            "--root=/files",
          ],
          essential: true,
          image: containerImage,
          logConfiguration: {
            logDriver:
              service.taskDefinition.defaultContainer?.logDriverConfig
                ?.logDriver,
            options:
              service.taskDefinition.defaultContainer?.logDriverConfig?.options,
          },
          memory: 512,
          mountPoints,
          name: service.taskDefinition.defaultContainer?.containerName,
          portMappings: [
            {
              containerPort: 80,
              hostPort: 80,
              protocol: "tcp",
            },
          ],
        },
      ],
      cpu: "256",
      executionRoleArn: service.taskDefinition.executionRole?.roleArn,
      family: service.taskDefinition.family,
      memory: "1024",
      networkMode:
        serviceType === ServiceType.EC2
          ? NetworkMode.BRIDGE
          : NetworkMode.AWS_VPC,
      requiresCompatibilities: [serviceType.toUpperCase()],
      taskRoleArn: service.taskDefinition.taskRole.roleArn,
      volumes,
    };

    /*
      We use `AwsCustomResource` to create a new task definition revision with EFS volume
      configurations, which is available in the AWS SDK.
    */
    const createOrUpdateCustomTaskDefinition = {
      action: "registerTaskDefinition",
      outputPath: "taskDefinition.taskDefinitionArn",
      parameters: customTaskDefinitionJson,
      physicalResourceId: PhysicalResourceId.fromResponse(
        "taskDefinition.taskDefinitionArn"
      ),
      service: "ECS",
    };
    const customTaskDefinition = new AwsCustomResource(
      service,
      "Custom" + serviceType + "TaskDefinition",
      {
        onCreate: createOrUpdateCustomTaskDefinition,
        onUpdate: createOrUpdateCustomTaskDefinition,
        policy: AwsCustomResourcePolicy.fromSdkCalls({
          resources: AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      }
    );
    service.taskDefinition.executionRole?.grantPassRole(
      customTaskDefinition.grantPrincipal
    );
    service.taskDefinition.taskRole.grantPassRole(
      customTaskDefinition.grantPrincipal
    );

    /*
      Finally, we'll update the ECS service to use the new task definition revision
      that we just created above.
    */
    (service.service.node.tryFindChild(
      "Service"
    ) as CfnService)?.addPropertyOverride(
      "TaskDefinition",
      customTaskDefinition.getResponseField("taskDefinition.taskDefinitionArn")
    );

    return service;
  }
}
