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

/**
 * ECS has some batshit names for CPUs. No real person will think that 256 means .25 of a CPU.
 *
 * Spell this out in a big, painful constant.
 *
 * 🧬 🧠 ?
 */
export const CPU_Memory = [
  {
    display: 1,
    cpu: 1024,
    memory: {
      2: 2048,
      3: 3072,
      4: 4096,
      5: 5120,
      6: 6144,
      7: 7168,
      8: 8192,
    },
  },
  {
    display: 2,
    cpu: 2048,
    memory: {
      4: 4096,
      5: 5120,
      6: 6144,
      7: 7168,
      8: 8192,
      9: 9 * 1024,
      10: 10 * 1024,
      11: 11 * 1024,
      12: 12 * 1024,
      13: 13 * 1024,
      14: 14 * 1024,
      15: 15 * 1024,
      16: 16 * 1024,
    },
  },
  {
    display: 4,
    cpu: 4096,
    memory: {
      8: 8192,
      9: 9 * 1024,
      10: 10 * 1024,
      11: 11 * 1024,
      12: 12 * 1024,
      13: 13 * 1024,
      14: 14 * 1024,
      15: 15 * 1024,
      16: 16 * 1024,
      17: 17 * 1024,
      18: 18 * 1024,
      19: 19 * 1024,
      20: 20 * 1024,
      21: 21 * 1024,
      22: 22 * 1024,
      23: 23 * 1024,
      24: 24 * 1024,
      25: 25 * 1024,
      26: 26 * 1024,
      27: 27 * 1024,
      28: 28 * 1024,
      29: 29 * 1024,
      30: 30 * 1024,
    },
  },
];

/**
 * Decode those goofy CPU values.
 */
export const decodeCPU = (cpu: string): number => {
  return CPU_Memory.find((e) => `${e.cpu}` === cpu).display;
};
