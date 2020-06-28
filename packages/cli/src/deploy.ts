import { Command } from "commander";
import { StackName } from "./constants";
import docs from "./docs";

export default new Command()
  .command("deploy [package]")
  .description("Deploys your pacakge to the cloud, creating and App and Stack.")
  .option("--stack <stack>", StackName, "default")
  .on("--help", () => {
    console.log(docs("deploy.md"));
  })
  .action(async () => {
    return;
  });
