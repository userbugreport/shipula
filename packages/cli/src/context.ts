import React from "react";
import { Credentials } from "./configuration";
import { Package, loadPackage } from "./nouns/package";
import { CloudFormation, ECS } from "aws-sdk";

/**
 * Thinks we know about a stack.
 */
export type ShipulaStack = {
  stack: CloudFormation.Stack;
  resources: CloudFormation.StackResources;
  webCluster: ECS.Cluster;
  webTasks: ECS.Tasks;
  webTaskDefinition: ECS.TaskDefinition;
};

/**
 * Put these props in the context.
 */
export type ShipulaContextProps = {
  /**
   * Update from deep in the react tree.
   */
  setContextState?: (context: ShipulaContextProps) => void;
  /**
   * When set, credentials are verified and can be used.
   */
  verifiedCredentials?: Credentials;
  /**
   * Work on this package.
   */
  package?: Package;
  /**
   * Work on this stack.
   */
  stackName?: string;
  /**
   * Last known error.
   */
  lastError?: Error;
  /**
   * We'll make some file on occasion and need to clean up.
   */
  cleanUpFiles?: string[];
  /**
   * Keep track of stacks, used to list and filter.
   */
  stacks?: CloudFormation.Stack[];
  /**
   * Current selected stack;
   */
  selectedStack?: ShipulaStack;
};

/**
 * Generate a consistent stack name from the context, with clean up
 * of invalid characters
 */
export const getStackName = (context: ShipulaContextProps): string => {
  return `${context.package.name.replace(
    /\W/g,
    ""
  )}-${context.stackName.replace(/\W/g, "")}`;
};

/**
 * Context contains the entire state. This is the 'store' from a
 * react point of view, and is stored in the React context.
 *
 * The first thing the context does -- is load up the configuration for
 * you -- so that is always available.
 */
export const ShipulaContext = React.createContext<ShipulaContextProps>({});

/**
 * Create a deployment context.
 */
export const buildDeployProps = async (
  packageDirectory: string,
  stackName?: string
): Promise<ShipulaContextProps> => {
  return {
    package: await loadPackage(packageDirectory),
    stackName: stackName || "default",
  };
};

/**
 * Create an info context.
 */
export const buildInfoProps = async (
  packageName?: string,
  stackName?: string
): Promise<ShipulaContextProps> => {
  return {
    package: {
      name: packageName,
    },
    stackName: stackName,
  };
};
