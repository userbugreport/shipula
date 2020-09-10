import * as Info from "./info";
import assert from "assert";
import { ErrorMessage } from "./errors";
import { CloudFormation, ECS } from "aws-sdk";
import { Package, loadPackage } from "./package";
import { AWSRegion, Credentials, completeCredentials } from "./configuration";

// re-export
export {
  Info,
  ErrorMessage,
  Package,
  loadPackage,
  AWSRegion,
  Credentials,
  completeCredentials,
};

/**
 * Generate a consistent stack name from the context, with clean up
 * of invalid characters.
 *
 * This is used for AWS services with flat namespaces, without / paths.
 */
export const getStackName = (
  packageName: string,
  stackName: string
): string => {
  assert(packageName, "A package name is required");
  assert(stackName, "A stack name is required");
  return `${packageName.replace(/\W/g, "")}-${stackName.replace(/\W/g, "")}`;
};

/**
 * Generate a consistent stack 'path' for AWS services that allow it.
 */
export const getStackPath = (
  packageName: string,
  stackName: string
): string => {
  assert(packageName, "A package name is required");
  assert(stackName, "A stack name is required");
  return `shipula/${packageName}/${stackName}`.replace(
    /[^\.\-_/#A-Za-z0-9]/g,
    ""
  );
};

/**
 * Thinks we know about a stack.
 */
export type ShipulaStack = {
  stack: CloudFormation.Stack;
  resources: CloudFormation.StackResources;
  webCluster: ECS.Cluster;
  webServices: ECS.Services;
  webTasks: ECS.Tasks;
  webTaskDefinition: ECS.TaskDefinition;
  parameters: AWS.SSM.ParameterList;
};

/**
 * Environment variables at the level of an individual
 * stack -- no / namespace or hierarchy these are
 * 'just env vars'
 */
export type ShipulaStackEnvironment = {
  [index: string]: string;
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
  /**
   * Variables we may be setting.
   */
  setVariables?: ShipulaStackEnvironment;

  /**
   * Specific timestamp of a backup to restore. This is a ISO date string. useable
   * in the context of an app and stack.
   */
  backupFrom?: string;

  /**
   * Setting a domain name?
   */
  domainName?: string;
};

/**
 * Set up the environment based on the shipula context.
 *
 * This is used to pass variables to the CDK.
 */
export const setShipulaEnvironmentForCDK = (
  context: ShipulaContextProps
): void => {
  // env var to get the stack named before the CDK context is created
  process.env.PACKAGE_FROM = context.package.from;
  process.env.PACKAGE_NAME = context.package.name;
  process.env.STACK_NAME = context.stackName;
  // do we have a prepublish?
  if (context.package.scripts.prepublish) process.env.PREPUBLISH = "YES";
};
