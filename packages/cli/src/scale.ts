import { Command } from "commander";
import { StackName } from "./constants";
import docs from "./docs";

export default new Command()
  .command("scale [package]")
  .description("Set scaling limits on your App / Stack.")
  .option("--stack <stack>", StackName, "default")
  .on("--help", () => {
    console.log(docs("scale.md"));
  })
  .action(async () => {
    return;
  });
