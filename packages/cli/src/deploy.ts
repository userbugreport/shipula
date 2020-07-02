import { Command } from "commander";
import docs from "./docs";

export default new Command()
  .command("deploy")
  .description("Deploys your pacakge to the cloud, creating and App and Stack.")
  .on("--help", () => {
    console.log(docs("deploy.md"));
  })
  .action(async () => {
    // validate login with 'our app'
    // make sure there is a CDKToolkit
    // deployment API ritual with CDK shelling out
    // need our package name cleaned, stage name -- those will form the stack name
    // and tags to be passed along

    return;
  });
