import React from "react";
import { Credentials } from "./configuration";

/**
 * Put these props in the context.
 */
export type ShipulaContextProps = {
  /**
   * When set, credentials are verified and can be used.
   */
  verifiedCredentials?: Credentials;
  /**
   * Work on this package.
   */
  packageName: string;
  /**
   * Last known error.
   */
  lastError?: Error;
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
});
