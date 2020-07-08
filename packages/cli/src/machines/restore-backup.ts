import { Machine, actions } from "xstate";
import { ShipulaContextProps, getStackName } from "../context";
import listBackup from "./list-backup";
import assert from "assert";
import AWS from "aws-sdk";

const PollInterval = 5000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    checkingSettings: NoSubState;
    listBackup: NoSubState;
    starting: NoSubState;
    displaying: NoSubState;
    working: NoSubState;
    error: NoSubState;
    done: NoSubState;
  };
}

type Events =
  | {
      type: "*";
      data: Error;
    }
  | {
      type: "DONE";
      data: Error;
    };

type Context = ShipulaContextProps & {
  /**
   * Data from AWS on the available backups.
   */
  availableBackups?: AWS.Backup.RecoveryPointByBackupVaultList;
  /**
   * Track the percent complete on taking this backup. Fun with
   * progress bars will ensue
   */
  percentComplete?: number;
  /**
   * Know the job that is running.
   */
  restoreJobId?: string;
};

/**
 * Start a backup job and poll for progress.
 */
export default Machine<Context, Schema, Events>({
  initial: "checkingSettings",
  states: {
    checkingSettings: {
      invoke: {
        src: async (context) => {
          assert(getStackName(context.package.name, context.stackName));
        },
        onDone: "listBackup",
        onError: "error",
      },
    },
    listBackup: {
      invoke: {
        src: listBackup,
        data: (context) => context,
        onDone: "starting",
        onError: "error",
      },
    },
    starting: {
      invoke: {
        src: async (context) => {
          context.percentComplete = 0.0;

          const backup = new AWS.Backup();
          const vaultName = getStackName(
            context.package.name,
            context.stackName
          );

          // filter down to the requested backup to restore
          const recoverThis = context.availableBackups.find(
            (b) => b.CompletionDate.toISOString() === context.backupFrom
          );

          const recoveryMetadata = await backup
            .getRecoveryPointRestoreMetadata({
              BackupVaultName: vaultName,
              RecoveryPointArn: recoverThis.RecoveryPointArn,
            })
            .promise();

          const efs = new AWS.EFS();
          const fileSystems = await efs
            .describeFileSystems({
              FileSystemId: recoveryMetadata.RestoreMetadata["file-system-id"],
            })
            .promise();

          const fileSystem = fileSystems.FileSystems[0];

          // now we know what -- and where
          const job = await backup
            .startRestoreJob({
              IdempotencyToken: new Date().toISOString(),
              ResourceType: "EFS",
              IamRoleArn: recoverThis.IamRoleArn,
              RecoveryPointArn: recoverThis.RecoveryPointArn,
              Metadata: {
                "file-system-id": fileSystem.FileSystemId,
                Encrypted: "true",
                KmsKeyId: fileSystem.KmsKeyId,
                PerformanceMode: fileSystem.PerformanceMode,
                newFileSystem: "false",
              },
            })
            .promise();
          context.restoreJobId = job.RestoreJobId;
        },
        onDone: "displaying",
        onError: "error",
      },
    },
    displaying: {
      on: {
        DONE: "done",
      },
      entry: actions.choose([
        {
          cond: (context) => context.percentComplete >= 0.9,
          actions: actions.send("DONE"),
        },
      ]),
      invoke: {
        src: async (context) => {
          assert(context);
          const backup = new AWS.Backup();
          const job = await backup
            .describeRestoreJob({
              RestoreJobId: context.restoreJobId,
            })
            .promise();
          context.percentComplete = parseFloat(job.PercentDone);
          if (job.Status.toUpperCase() === "FAILED")
            throw new Error(job.StatusMessage);
          if (job.Status.toUpperCase() === "COMPLETED")
            context.percentComplete = 1.0;
        },
        onDone: "working",
        onError: "error",
      },
    },
    working: {
      after: {
        [PollInterval]: "displaying",
      },
    },
    error: {
      type: "final",
      entry: actions.assign({
        lastError: (_context, event) => event?.data,
      }),
    },
    done: { type: "final" },
  },
});
