import React from "react";
import { Box, Text } from "ink";
import { ShipulaContext } from "../context";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import takeBackup from "../machines/take-backup";
import { Stacks } from "./Stacks";
import useStdoutDimensions from "ink-use-stdout-dimensions";
import ProgressBar from "ink-progress-bar";

/**
 * No props needed, the app context is enough.
 */
type Props = never;

/**
 * List our stacks -- or drill in detail into one.
 */
export const Backup: React.FunctionComponent<Props> = () => {
  const [columns] = useStdoutDimensions();
  console.assert(columns);
  // the app context is *the* shared data all the way down to
  // the state machines
  const appContext = React.useContext(ShipulaContext);
  // all of the actual activity is delegated to the state machine
  const [state] = useMachine(takeBackup, {
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
      {state.context.percentComplete > 0 && (
        <Box borderStyle="single" flexDirection="row" width={columns / 2 + 2}>
          <ProgressBar
            columns={columns / 2}
            color="green"
            percent={state.context.percentComplete}
          />
        </Box>
      )}
      {state.context.stacks && <Stacks stacks={state.context.stacks} />}
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};
