import React from "react";
import { Text } from "ink";
import { ShipulaContext, getStackName } from "../context";
import { CloudFormation } from "aws-sdk";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingMachine } from "./Machines";

const machine = LoadingMachine<CloudFormation.DescribeStacksOutput>();

type Props = never;
/**
 * Gather and display information about a stack based
 * on the current context.
 */
export const Info: React.FunctionComponent<Props> = () => {
  const appContext = React.useContext(ShipulaContext);
  const [state, send] = useMachine(machine, {
    services: {
      readData: async (context) => {
        console.assert(context);
        console.assert(send);
        const cloudFormation = new CloudFormation();
        const stackInfo = await new Promise<
          CloudFormation.DescribeStacksOutput
        >((resolve, reject) => {
          cloudFormation.describeStacks(
            { StackName: getStackName(appContext) },
            (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            }
          );
        });
        return stackInfo;
      },
    },
  });
  return (
    <>
      {state.value === "verifyingCredentials" && (
        <Text>
          <Spinner type="dots" />
        </Text>
      )}
      {state.value === "displayingError" && (
        <ErrorMessage error={state.context.lastError} />
      )}
      {state.value === "loaded" && <Text>{state.context.data.toString()}</Text>}
    </>
  );
};
