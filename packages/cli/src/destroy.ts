import { Command } from "commander";
import docs, { StackName, PackageName } from "./docs";
import { Destroy } from "./components/Destroy";
import { display } from "./components/application";
import { buildInfoProps } from "./context";

export default new Command()
  .command("destroy")
  .description("Completely remove a Stack from an App")
  .option("--packageName <packageName>", PackageName)
  .option("--stackName <stackName>", StackName)
  .on("--help", () => {
    console.log(docs("destroy.md"));
  })
  .action(async (command) => {
    display(
      await buildInfoProps(command.packageName, command.stackName),
      Destroy
    );
    return;
  });
