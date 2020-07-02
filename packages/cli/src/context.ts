import React from "react";
import { Credentials } from "./configuration";

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
  packageName: string;
  /**
   * Work on this stack.
   */
  stackName: string;
  /**
   * Last known error.
   */
  lastError?: Error;
};

/**
 * Generate a consistent stack name from the context, with clean up
 * of invalid characters
 */
export const getStackName = (context: ShipulaContextProps): string => {
  return `${context.packageName.replace(/\W/g, "")}-${context.stackName.replace(
    /\W/g,
    ""
  )}`;
};

/**
 * Context contains the entire state. This is the 'store' from a
 * react point of view, and is stored in the React context.
 *
 * The first thing the context does -- is load up the configuration for
 * you -- so that is always available.
 */
export const ShipulaContext = React.createContext<ShipulaContextProps>({
  packageName: "",
  stackName: "",
});
