import { Command } from "commander";
import { StackName } from "./constants";
import docs from "./docs";

export default new Command()
  .command("env [package]")
  .description("Manage environment variables for an App/Stack.")
  .option("--stack <stack>", StackName, "default")
  .on("--help", () => {
    console.log(docs("env.md"));
  })
  .action(async () => {
    return;
  });
