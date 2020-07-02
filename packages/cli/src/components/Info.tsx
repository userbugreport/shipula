import React from "react";
import { Text, Box } from "ink";
import { ShipulaContext, getStackName } from "../context";
import { CloudFormation } from "aws-sdk";
import { useMachine } from "@xstate/react";
import Spinner from "ink-spinner";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingMachine } from "./Machines";
import yaml from "yaml";

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
  // this is the most important part to get
  const getUrl = (stack: CloudFormation.DescribeStacksOutput): string => {
    return stack.Stacks[0].Outputs.filter((o) =>
      o.OutputValue.startsWith("http")
    )[0]?.OutputValue;
  };
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
      {state.value === "loaded" && (
        <>
          <Box flexDirection="row">
            <Text>URL: </Text>
            <Text>{getUrl(state.context.data)}</Text>
          </Box>
          <Text>{yaml.stringify(state.context.data)}</Text>
        </>
      )}
    </>
  );
};
