import React from "react";
import { Text } from "ink";
import { ShipulaContext } from "../context";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import destroyStack from "../machines/destroy-stack";
import { Stacks } from "./Stacks";

/**
 * No props needed, the app context is enough.
 */
type Props = never;

/**
 * List our stacks -- or destory one if we have enough information.
 */
export const Destroy: React.FunctionComponent<Props> = () => {
  // the app context is *the* shared data all the way down to
  // the state machines
  const appContext = React.useContext(ShipulaContext);
  // all of the actual activity is delegated to the state machine
  const [state] = useMachine(destroyStack, {
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
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};
