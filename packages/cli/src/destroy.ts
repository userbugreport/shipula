import { Command } from "commander";
import { StackName } from "./constants";
import docs from "./docs";

export default new Command()
  .command("destroy [package]")
  .description("Completely remove a Stack from an App")
  .option("--stack <stack>", StackName, "default")
  .on("--help", () => {
    console.log(docs("destroy.md"));
  })
  .action(async () => {
    return;
  });
