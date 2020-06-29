import fs from "fs-extra";
import expandTide from "expand-tilde";
import path from "path";
import { cosmiconfig } from "cosmiconfig";

export type Region = "us-east-1" | "us-west-1";

/**
 * Look here to know everything that can be configured.
 */
export type Configuration = {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: Region;
};

/**
 * Load up the configuration with the 'new-normal' cosmic config thing.
 *
 * The one difference is -- we'll be looking for a ~/.shipula.json as well that
 * will be a default backstop location for AWS keys.
 */
export const getConfiguration = async (): Promise<Configuration> => {
  let initialConfig: Configuration = {
    AWS_ACCESS_KEY_ID: undefined,
    AWS_SECRET_ACCESS_KEY: undefined,
    AWS_REGION: "us-east-1",
  };
  try {
    // defaults from user home dotfile
    const userHomeConfig = path.join(expandTide("~"), ".shipula.json");
    if (await fs.pathExists(userHomeConfig)) {
      const userHomeConfigProps = JSON.parse(
        await fs.readFile(userHomeConfig, "utf8")
      );
      // keep on writing over -- discovery new props
      initialConfig = {
        ...initialConfig,
        ...userHomeConfigProps,
      };
    }
    const explorer = cosmiconfig("shipula");
    const configProps = await explorer.search();
    // per project config is the 'most specific', so it will
    // write over user home directory
    // I used to say 'trumps the config' a lot, but ...
    if (configProps) {
      initialConfig = {
        ...initialConfig,
        ...configProps.config,
      };
    }
  } catch (e) {
    console.error(e);
  } finally {
    // be extremely forgiving
    return initialConfig;
  }
};
