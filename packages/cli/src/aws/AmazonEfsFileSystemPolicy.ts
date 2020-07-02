import { FileSystem } from "@aws-cdk/aws-efs";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "@aws-cdk/custom-resources";
import { Arn } from "@aws-cdk/core";
import { AmazonEfsAccessPoints } from "./AmazonEfsAccessPoints";
import { ApplicationLoadBalancedFargateService } from "@aws-cdk/aws-ecs-patterns";

/**
 * We use this `AwsCustomResource` construct to create the EFS filesystem policy via the AWS SDK. This
 * is a stop-gap until support for creating EFS filesystem policies via CloudFormation and CDK is available.
 */
export class AmazonEfsFileSystemPolicy extends AwsCustomResource {
  constructor(
    fileSystem: FileSystem,
    id: string,
    accessPoints: AmazonEfsAccessPoints,
    ecsOnFargateService: ApplicationLoadBalancedFargateService
  ) {
    // We'll be using this value several times throughout.
    const fileSystemArn = Arn.format(
      {
        service: "elasticfilesystem",
        resource: "file-system",
        resourceName: fileSystem.fileSystemId,
      },
      fileSystem.stack
    );
    /*
      Initialize statement list with equivalent of:
        * Disable root access by default
        * Enforce read-only access by default
        * Enforce in-transit encryption for all clients
        * Allow R/W from our ECS instances
     */
    const statements = [
      {
        Sid: "DisableRootAccessAndEnforceReadOnlyByDefault",
        Effect: "Allow",
        Action: "elasticfilesystem:ClientMount",
        Principal: {
          AWS: "*",
        },
        Resource: fileSystemArn,
      },
      {
        Sid: "EnforceInTransitEncryption",
        Effect: "Deny",
        Action: ["*"],
        Principal: {
          AWS: "*",
        },
        Resource: fileSystemArn,
        Condition: {
          Bool: { "aws:SecureTransport": false },
        },
      },
      {
        Sid: "EcsOnFargateCloudCmdTaskReadWriteAccess",
        Effect: "Allow",
        Action: [
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite",
        ],
        Principal: {
          AWS: ecsOnFargateService.taskDefinition.taskRole.roleArn,
        },
        Resource: fileSystemArn,
        Condition: {
          StringEquals: {
            "elasticfilesystem:AccessPointArn": [
              ...accessPoints.values(),
            ].map((accessPoint) =>
              accessPoint.getResponseField("AccessPointArn")
            ),
          },
        },
      },
    ];

    // the action to apply the statements just created
    const createOrUpdateFileSystemPolicy = {
      action: "putFileSystemPolicy",
      parameters: {
        FileSystemId: fileSystem.fileSystemId,
        Policy: fileSystem.stack.toJsonString({
          Version: "2012-10-17",
          Statement: statements,
        }),
      },
      physicalResourceId: PhysicalResourceId.fromResponse("FileSystemId"),
      service: "EFS",
    };

    // Create the actual policy based on the statements assembled above.
    super(fileSystem.stack, id, {
      onCreate: createOrUpdateFileSystemPolicy,
      onUpdate: createOrUpdateFileSystemPolicy,
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
  }
}
