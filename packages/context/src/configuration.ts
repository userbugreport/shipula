export const AllAWSRegions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
] as const;
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
