import React from "react";
import { Credentials } from "./configuration";
import { CloudFormation, ECS } from "aws-sdk";
import assert from "assert";
import path from "path";
import fs from "fs-extra";
import { errorMessage } from "./docs";

/**
 * A specific node package. We don't need all the properties
 * of `package.json`, just the few we care about.
 */
export type Package = {
  /**
   * This needs to be from somewhere on disk.
   */
  from?: string;
  /**
   * Gotta call it something. This is the source, uncleaned names.
   */
  name: string;

  /**
   * Pull the version string through to be a nice guy Ui friend -- this
   * is useful for display and for tagging cloud resources.
   */
  version?: string;

  /**
   * Need a start script to exist.
   */
  scripts?: {
    start?: string;
  };
};

/**
 * Load -- just throws if there are ny problems at all.
 */
export const loadPackage = async (filename?: string): Promise<Package> => {
  try {
    const defaultToWorkingDirectory = filename || ".";
    const forgiveDirectory =
      path.basename(defaultToWorkingDirectory, ".json") === "package"
        ? path.resolve(defaultToWorkingDirectory)
        : path.resolve(defaultToWorkingDirectory, "package.json");
    const p = (await fs.readJson(forgiveDirectory)) as Package;
    p.from = path.dirname(forgiveDirectory);
    assert(p.name, "Must have a name in your package.");
    assert(p.version, "Must have a version in your package");
    assert(
      p?.scripts?.start,
      "Must have a scripts section with a start command in your pacakge"
    );
    return p;
  } catch (e) {
    const err: Error = e;
    if (err.message.startsWith("ENOENT")) throw errorMessage("nopackage.md");
    throw e;
  }
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
 * Generate a consisten stack 'path' for AWS services that allow it.
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
  packageDirectory?: string,
  stackName?: string
): Promise<ShipulaContextProps> => {
  return buildDeployProps(packageDirectory, stackName);
};

/**
 * Create a context for setting and updateing the environment.
 */
export const buildEnvProps = async (
  packageDirectory?: string,
  stackName?: string,
  variables?: string[]
): Promise<ShipulaContextProps> => {
  // ok -- since the stack name is -- not required, forgive a
  // variable looking thing in the stack name spot
  if (stackName?.includes("=")) {
    variables = [stackName, ...(variables || [])];
    stackName = "default";
  }
  // parse out those variables
  const setVariables = Object.fromEntries(
    variables
      ?.map((v) => v.split("="))
      .map(([n, v]) => {
        const name = n.replace(/\W/g, "");
        return [name, v];
      }) || []
  );
  const deployProps = await buildDeployProps(packageDirectory, stackName);
  return {
    ...deployProps,
    setVariables,
  };
};
