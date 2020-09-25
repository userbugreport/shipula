import React from "react";
import { ShipulaContextProps } from "@shipula/context";
import { loadPackage } from "@shipula/context";

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
  const setVariables = Object.fromEntries(
    (variables || []).map((variable) => {
      const splitAt = variable.indexOf("=");
      return [
        variable.substr(0, splitAt).replace(/\W/g, ""),
        variable.substr(splitAt + 1),
      ];
    })
  );
  const deployProps = await buildDeployProps(packageDirectory, stackName);
  return {
    ...deployProps,
    setVariables,
  };
};
