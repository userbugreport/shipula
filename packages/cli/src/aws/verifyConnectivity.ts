import { ShipulaContext } from "../context";
import AWS from "aws-sdk";

/**
 * A lot of the action is talking to AWS -- make sure that you can.
 *
 * This is a no news is good news, any problem throws out an exception
 * that will need to be corrected.
 */
export default async (context: ShipulaContext): Promise<void> => {
  // transfer the credentials through to the environment varaibles
  process.env.AWS_ACCESS_KEY_ID = context.configuration.AWS_ACCESS_KEY_ID;
  process.env.AWS_SECRET_ACCESS_KEY =
    context.configuration.AWS_SECRET_ACCESS_KEY;
  process.env.AWS_REGION = context.configuration.AWS_REGION;
  // everything we're making is going to be a CloudFormation stack
  // so query and see apps
  try {
    const cloudFormation = new AWS.CloudFormation();
    await new Promise((resolve, reject) => {
      cloudFormation.listStacks((err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  } catch (e) {
    // lots of errors that mean we need to go to an interactive login
    if (e.code === "InvalidClientTokenId") {
    } else {
      // spy here for a while
      console.error(e);
    }
  }
};
