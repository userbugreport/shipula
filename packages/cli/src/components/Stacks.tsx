import React from "react";
import { CloudFormation } from "aws-sdk";
import { Box, Text } from "ink";
import useStdoutDimensions from "ink-use-stdout-dimensions";

type Props = {
  /**
   * Shows these stacks.
   */
  stacks: CloudFormation.Stack[];
};

/**
 * List out stacks.
 */
export const Stacks: React.FC<Props> = ({ stacks }: Props) => {
  const [columns] = useStdoutDimensions();
  // re-format the table into the columns we like
  const getTag = (stack: CloudFormation.Stack, key: string): string => {
    return stack.Tags?.find((t) => t.Key === key)?.Value;
  };

  return (
    <>
      <Box flexDirection="column" width={columns}>
        <Box>
          <Box width="20%">
            <Text>Package</Text>
          </Box>
          <Box width="20%">
            <Text>Stack</Text>
          </Box>
          <Box width="20">
            <Text>Status</Text>
          </Box>
        </Box>
        {stacks.map((stack) => (
          <Box key={stack.StackId}>
            <Box width="20%">
              <Text>{getTag(stack, "packageName")}</Text>
            </Box>
            <Box width="20%">
              <Text>{getTag(stack, "stackName")}</Text>
            </Box>
            <Box width="20">
              <Text>{stack.StackStatus}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
};
