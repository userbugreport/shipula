import { getConfiguration, Configuration } from "./configuration";

/**
 * Context contains the entire state. This is the 'store' from a
 * react point of view.
 *
 * The first thing the context does -- is load up the configuration for
 * you -- so that is always available.
 */
export type Context = {
  configuration: Configuration;
};

/**
 * When you start up the app -- call this to get an initial context.
 */
export const buildContext = async (): Promise<Context> => {
  return {
    configuration: await getConfiguration(),
  };
};
