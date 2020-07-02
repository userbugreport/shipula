import React from "react";
import { Text } from "ink";
import { ShipulaContext, getStackName } from "../context";
import { CloudFormation } from "aws-sdk";

type Props = {
  none?: string;
};
/**
 * Gather and display information about a stack based
 * on the current context.
 */
export const Info: React.FunctionComponent<Props> = () => {
  const appContext = React.useContext(ShipulaContext);
  const [stack, setStack] = React.useState<
    CloudFormation.DescribeStacksOutput
  >();

  React.useEffect(() => {
    const load = async () => {
      const cloudFormation = new CloudFormation();
      const stackInfo = await new Promise<CloudFormation.DescribeStacksOutput>(
        (resolve, reject) => {
          cloudFormation.describeStacks(
            { StackName: getStackName(appContext) },
            (err, data) => {
              if (err) reject(err);
              else resolve(data);
            }
          );
        }
      );
      setStack(stackInfo);
    };
    load();
  });

  return (
    <>
      <Text>{stack && stack.toString()}</Text>
    </>
  );
};
