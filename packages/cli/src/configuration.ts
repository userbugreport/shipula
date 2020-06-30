import fs from "fs-extra";
import expandTide from "expand-tilde";
import path from "path";

export const AllAWSRegions = ["us-east-1", "us-west-1"] as const;
export type AWSRegion = typeof AllAWSRegions[number];
/**
 * Information to connect to AWS. Region is in there since
 * AWS requires it for all the services we'll be using.
 */
export type Credentials = {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: AWSRegion;
};

/**
 * If credentials are fully filled out
 */
export const completeCredentials = (credentials: Credentials): boolean => {
  return (
    (credentials?.AWS_ACCESS_KEY_ID?.length &&
      credentials?.AWS_SECRET_ACCESS_KEY?.length &&
      credentials?.AWS_REGION?.length) > 0
  );
};

/**
 * Credentials can be in environment variables, or in a user dotfile.
 */
export const getCredentials = async (): Promise<Credentials> => {
  //
  let initialConfig: Credentials = {
    AWS_ACCESS_KEY_ID: undefined,
    AWS_SECRET_ACCESS_KEY: undefined,
    // default region
    AWS_REGION: "us-east-1",
  };
  try {
    // defaults from user home dotfile
    const userHomeConfig = path.join(expandTide("~"), ".shipula.json");
    if (await fs.pathExists(userHomeConfig)) {
      const userHomeConfigProps = JSON.parse(
        await fs.readFile(userHomeConfig, "utf8")
      ) as Credentials;
      // keep on writing over -- discovery new props
      initialConfig = {
        ...initialConfig,
        ...userHomeConfigProps,
      };
    }
    // env var can be set on the command line -- so they take precedence
    // over the dotfile
    initialConfig.AWS_SECRET_ACCESS_KEY =
      process.env.AWS_SECRET_ACCESS_KEY || initialConfig.AWS_SECRET_ACCESS_KEY;
    initialConfig.AWS_ACCESS_KEY_ID =
      process.env.AWS_ACCESS_KEY_ID || initialConfig.AWS_ACCESS_KEY_ID;
    initialConfig.AWS_REGION =
      (process.env.AWS_REGION as AWSRegion) || initialConfig.AWS_REGION;
  } catch (e) {
    console.error(e);
  } finally {
    // be extremely forgiving
    return initialConfig;
  }
};
