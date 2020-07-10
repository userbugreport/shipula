import React from "react";
import { Text } from "ink";
import { ShipulaContext } from "../context";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import { showLogs } from "@shipula/machines";

/**
 * No props needed, the app context is enough.
 */
type Props = never;

/**
 * Gather and display information about logs messages.
 */
export const Logs: React.FunctionComponent<Props> = () => {
  // the app context is *the* shared data all the way down to
  // the state machines
  const appContext = React.useContext(ShipulaContext);
  // all of the actual activity is delegated to the state machine
  const [state] = useMachine(showLogs, {
    context: appContext,
  });
  // the display just shows what the state machine is doing
  // when we are done -- show nothing
  // when we are streaming -- hide our spinner and just stream
  return (
    <>
      {!(state.done || state.value === "displaying") && (
        <Text>
          <Spinner type="dots" /> {state.value}
        </Text>
      )}
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};
