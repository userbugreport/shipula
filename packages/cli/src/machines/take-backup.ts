import { Machine, actions } from "xstate";
import { ShipulaContextProps, getStackName } from "../context";
import assert from "assert";
import AWS from "aws-sdk";
import { listBackupPlans } from "../aws/info";

const PollInterval = 5000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    checkingSettings: NoSubState;
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
   * Track the percent complete on taking this backup. Fun with
   * progress bars will ensue
   */
  percentComplete?: number;
  /**
   * Know the job that is running.
   */
  backupJobId?: string;
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
        onDone: "starting",
        onError: "error",
      },
    },
    starting: {
      invoke: {
        src: async (context) => {
          context.percentComplete = 0.0;
          const backup = new AWS.Backup();
          const planName = getStackName(
            context.package.name,
            context.stackName
          );
          // shared name
          const vaultName = planName;
          const plans = await listBackupPlans();
          const currentPlan = plans.find((p) => p.BackupPlanName === planName);

          const selection = await backup
            .listBackupSelections({
              BackupPlanId: currentPlan.BackupPlanId,
            })
            .promise();
          // this API is pretty roundabout but I cna get the selection
          // which has an IAM role to use
          const efsSelection = selection.BackupSelectionsList.find(
            (f) => f.SelectionName === "Efs"
          );
          // and then get the selection another way -- and get the ARM
          // of the thing to actually back up
          const efs = await backup
            .getBackupSelection({
              BackupPlanId: currentPlan.BackupPlanId,
              SelectionId: efsSelection.SelectionId,
            })
            .promise();
          const job = await backup
            .startBackupJob({
              BackupVaultName: vaultName,
              ResourceArn: efs.BackupSelection.Resources[0],
              IamRoleArn: efsSelection.IamRoleArn,
            })
            .promise();
          context.backupJobId = job.BackupJobId;
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
            .describeBackupJob({
              BackupJobId: context.backupJobId,
            })
            .promise();
          context.percentComplete = parseFloat(job.PercentDone);
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
