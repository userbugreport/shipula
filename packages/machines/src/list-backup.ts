import { Machine, actions } from "xstate";
import { ShipulaContextProps, getStackName } from "@shipula/context";
import assert from "assert";
import AWS from "aws-sdk";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    checkingSettings: NoSubState;
    listing: NoSubState;
    error: NoSubState;
    done: NoSubState;
  };
}

type Events = {
  type: "*";
  data: Error;
};

type Context = ShipulaContextProps & {
  /**
   * Data from AWS on the available backups.
   */
  availableBackups?: AWS.Backup.RecoveryPointByBackupVaultList;
};

/**
 * List available backups for a given resource
 */
export const listRecoveryPoints = async (
  vaultName: string
): Promise<AWS.Backup.RecoveryPointByBackupVaultList> => {
  const backup = new AWS.Backup();
  let buffer = new Array<AWS.Backup.RecoveryPointByBackupVault>();

  const more = async (
    nextToken: string
  ): Promise<AWS.Backup.ListRecoveryPointsByBackupVaultOutput> => {
    return backup
      .listRecoveryPointsByBackupVault({
        BackupVaultName: vaultName,
        ByResourceType: "EFS",
        NextToken: nextToken === "-" ? undefined : nextToken,
      })
      .promise();
  };

  let token = "-";
  // more to fetch...
  while (token) {
    const { RecoveryPoints, NextToken } = await more(token);
    buffer = [...buffer, ...RecoveryPoints];
    token = NextToken;
  }
  return buffer.filter((r) => r.Status === "COMPLETED");
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
        onDone: "listing",
        onError: "error",
      },
    },
    listing: {
      invoke: {
        src: async (context) => {
          const vaultName = getStackName(
            context.package.name,
            context.stackName
          );
          context.availableBackups = await listRecoveryPoints(vaultName);
        },
        onDone: "done",
        onError: "error",
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
