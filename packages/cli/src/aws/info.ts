import AWS, { CloudFormation } from "aws-sdk";

/**
 * List all Shipula stacks. This grabs all stacks
 * and filters down by tag.
 */
export const listShipulaStacks = async (): Promise<CloudFormation.Stack[]> => {
  const cloudFormation = new AWS.CloudFormation();
  let buffer = new Array<CloudFormation.Stack>();

  const more = async (
    nextToken: string
  ): Promise<CloudFormation.DescribeStacksOutput> => {
    return new Promise((resolve, reject) => {
      cloudFormation.describeStacks(
        {
          NextToken: nextToken === "-" ? undefined : nextToken,
        },
        (err, data) => {
          if (err) reject(err);
          else resolve(data);
        }
      );
    });
  };
  let token = "-";
  // more to fetch...
  while (token) {
    const { Stacks, NextToken } = await more(token);
    buffer = [...buffer, ...Stacks];
    token = NextToken;
  }
  // let exceptions leak and be handled by state machines
  // calling this
  return buffer.filter((stack) =>
    stack?.Tags?.find(
      (tag) => tag.Key === "createdBy" && tag.Value === "shipula"
    )
  );
};
