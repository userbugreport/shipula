import { Command } from "commander";
import { buildInfoProps } from "./context";
import docs, { StackName } from "./docs";
import { display } from "./components/application";
import { Logs } from "./components/Logs";

export default new Command()
  .command("logs")
  .description("Stream real time logs or search cloud stored logs.")
  .option("--stackName <stackName>", StackName)
  .option(
    "--search <query>",
    "Search for this content in log messages, returning matches"
  )
  .on("--help", () => {
    console.log(docs("logs.md"));
  })
  .action(async (command) => {
    display(await buildInfoProps(command.packageName, command.stackName), Logs);
    return;
  });
