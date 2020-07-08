import React from "react";
import { Text, Box } from "ink";
import { ShipulaContext, displayStack } from "../context";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import infoStack from "../machines/info-stack";
import { Stacks } from "./Stacks";
import yaml from "yaml";
import useStdoutDimensions from "ink-use-stdout-dimensions";

/**
 * No props needed, the app context is enough.
 */
type Props = never;

/**
 * Set up a DNS name.
 */
export const DnsName: React.FunctionComponent<Props> = () => {
  const [columns] = useStdoutDimensions();
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
      {state.context.stacks && <Stacks stacks={state.context.stacks} />}
      {state.context.selectedStack && (
        <Box flexDirection="column" width={columns}>
          <Text>{false && yaml.stringify(state.context.selectedStack)}</Text>
          <Text>
            {yaml.stringify(displayStack(state.context.selectedStack))}
          </Text>
        </Box>
      )}
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};
