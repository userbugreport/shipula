import React from "react";
import { Box, Text } from "ink";
import { ShipulaContext } from "../context";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import { takeBackup, restoreBackup, listBackup } from "@shipula/machines";
import useStdoutDimensions from "ink-use-stdout-dimensions";
import ProgressBar from "ink-progress-bar";

type Props = {
  machine: typeof takeBackup | typeof restoreBackup;
};

/**
 * Our dual purpose backup display.
 */
const Backup: React.FunctionComponent<Props> = ({ machine }: Props) => {
  const [columns] = useStdoutDimensions();
  // the app context is *the* shared data all the way down to
  // the state machines
  const appContext = React.useContext(ShipulaContext);
  // all of the actual activity is delegated to the state machine
  const [state] = useMachine(machine, {
    context: {
      ...appContext,
    },
  });

  // the display just shows what the state machine is doing
  return (
    <>
      {!state.done && (
        <Text>
          <Spinner type="dots" /> {state.value}
        </Text>
      )}
      {state.context.percentComplete > 0 && (
        <Box borderStyle="single" flexDirection="row" width={columns / 2 + 2}>
          <ProgressBar
            columns={columns / 2}
            color="green"
            percent={state.context.percentComplete}
          />
        </Box>
      )}
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};

/**
 * Used to take backups
 */
export const TakeBackup: React.FC<never> = () => {
  return <Backup machine={takeBackup}></Backup>;
};

/**
 * Used to take backups
 */
export const RestoreBackup: React.FC<never> = () => {
  return <Backup machine={restoreBackup}></Backup>;
};

/**
 * Display the available backups when the user didn't specify
 */
export const ListBackups: React.FunctionComponent<never> = () => {
  const [columns] = useStdoutDimensions();
  console.assert(columns);
  // the app context is *the* shared data all the way down to
  // the state machines
  const appContext = React.useContext(ShipulaContext);
  // all of the actual activity is delegated to the state machine
  const [state] = useMachine(listBackup, {
    context: appContext,
  });

  // the display just shows what the state machine is doing
  return (
    <>
      {!state.done && (
        <Text>
          <Spinner type="dots" /> {state.value}
        </Text>
      )}
      <Box flexDirection="column">
        <Box>
          <Box width="20%">
            <Text>Backup From</Text>
          </Box>
        </Box>
        {state.context.availableBackups &&
          state.context.availableBackups?.map((backup) => (
            <Box key={backup.RecoveryPointArn}>
              <Box width="20%">
                <Text>{backup.CompletionDate.toISOString()}</Text>
              </Box>
            </Box>
          ))}
      </Box>
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};
