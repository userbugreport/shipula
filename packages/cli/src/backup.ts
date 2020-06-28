import { Command } from "commander";
import { StackName } from "./constants";
import docs from "./docs";

export default new Command()
  .command("backup [package]")
  .description(
    "Creates a backup copy of your App/Stack file system, and provides a link where you can download it."
  )
  .option("--stack <stack>", StackName, "default")
  .on("--help", () => {
    console.log(docs("backup.md"));
  })
  .action(async () => {
    return;
  });
