import React from "react";
import { Box, Text } from "ink";
import { ShipulaContext } from "../context";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import { infoStack } from "@shipula/machines";
import useStdoutDimensions from "ink-use-stdout-dimensions";
import { displayEnvironment } from "./Info";
import { Environment } from "@shipula/context";

/**
 * No props needed, the app context is enough.
 */
type Props = never;

/**
 * Update the running environment variables.
 */
export const EnvGet: React.FunctionComponent<Props> = () => {
  // the app context is *the* shared data all the way down to
  // the state machines
  const appContext = React.useContext(ShipulaContext);
  // all of the actual activity is delegated to the state machine
  const [state] = useMachine(infoStack, {
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
      {state.context.selectedStack && (
        <DisplayEnvironment
          environment={state.context.selectedStack.environment}
        />
      )}
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};

export type DisplayEnvironmentProps = {
  environment: Environment;
};

/**
 * Just show environment variables.
 */
export const DisplayEnvironment: React.FC<DisplayEnvironmentProps> = ({
  environment,
}: DisplayEnvironmentProps) => {
  const [columns] = useStdoutDimensions();
  return (
    <Box flexDirection="column" width={columns}>
      {Object.entries(displayEnvironment(environment)).map((e) => {
        return (
          <Text key={e[0]}>
            {e[0]}={e[1]}
          </Text>
        );
      })}
    </Box>
  );
};
