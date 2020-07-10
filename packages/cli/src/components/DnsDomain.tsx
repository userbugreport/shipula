import React from "react";
import { Text, Static } from "ink";
import { ShipulaContext } from "../context";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import { createDomain } from "@shipula/machines";

/**
 * No props needed, the app context is enough.
 */
type Props = never;

/**
 * Set up a DNS domain.
 */
export const DnsDomain: React.FunctionComponent<Props> = () => {
  const appContext = React.useContext(ShipulaContext);
  const [state] = useMachine(createDomain, {
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
      {state.context.nameServers && (
        <>
          <Static
            items={[...state.context.messages, ...state.context.nameServers]}
          >
            {(name) => (
              <Text key={name} bold={name.startsWith("ns")}>
                {name}
              </Text>
            )}
          </Static>
        </>
      )}
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};
