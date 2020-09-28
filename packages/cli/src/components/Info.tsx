import React from "react";
import { Text, Box } from "ink";
import { ShipulaContext } from "../context";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import { infoStack } from "@shipula/machines";
import { Stacks } from "./Stacks";
import yaml from "yaml";
import useStdoutDimensions from "ink-use-stdout-dimensions";
import {
  Info as ShipulaInfo,
  ShipulaStack,
  Environment,
  ServiceWithTaskDefinition,
} from "@shipula/context";
import path from "path";

/**
 * Cherry pick out parameters.
 */
export const displayEnvironment = (environment: Environment) => {
  return Object.fromEntries(
    environment.map((p) => [path.basename(p.Name), p.Value])
  );
};

/**
 * Cherry pick service info.
 */
export const displayService = (
  stack: ShipulaStack,
  service: ServiceWithTaskDefinition
) => {
  return {
    name: service.serviceName,
    url: stack.stack.Outputs.find(
      (o) =>
        o.OutputKey.startsWith(service.serviceName) &&
        o.OutputValue.startsWith("http")
    )?.OutputValue,
    numberRunning: service.runningCount,
    cpu: ShipulaInfo.decodeCPU(service.task.taskDefinition.cpu),
    memory: Number.parseInt(service.task.taskDefinition.memory),
    ports: service.task.taskDefinition.containerDefinitions.flatMap((c) =>
      c.portMappings.map((p) => p.containerPort)
    ),
    sharedVolumes: service.task.taskDefinition.containerDefinitions.flatMap(
      (c) => c.mountPoints.map((m) => m.containerPath)
    ),
  };
};

/**
 * Cherry pick the parts we want to display.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const displayStack = (stack: ShipulaStack) => {
  return {
    services:
      stack.webCluster?.services.map((service) =>
        displayService(stack, service)
      ) || "Static Site",
    environment: displayEnvironment(stack.environment),
  };
};

/**
 * No props needed, the app context is enough.
 */
type Props = never;

/**
 * List our stacks -- or drill in detail into one.
 */
export const Info: React.FunctionComponent<Props> = () => {
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
            {true && yaml.stringify(displayStack(state.context.selectedStack))}
          </Text>
        </Box>
      )}
      {state.context.lastError && (
        <ErrorMessage error={state.context.lastError} />
      )}
    </>
  );
};
