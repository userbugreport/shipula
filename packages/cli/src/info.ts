import { Command } from "commander";
import docs, { StackName, PackageName } from "./docs";
import { Info } from "./components/Info";
import { display } from "./components/application";
import { buildInfoProps } from "./context";

export default new Command()
  .command("info")
  .description("This will tell you all about your App and Stack.")
  .option("--packageName <packageName>", PackageName)
  .option("--stackName <stackName>", StackName)
  .on("--help", () => {
    console.log(docs("destroy.md"));
  })
  .action(async (command) => {
    display(await buildInfoProps(command.packageName, command.stackName), Info);
    return;
  });
