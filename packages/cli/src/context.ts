import React from "react";
import { ShipulaContextProps } from "@shipula/context";
import { loadPackage } from "@shipula/context/build/package";

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
 * Create a context for setting and updating the environment.
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
