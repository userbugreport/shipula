import { Command } from "commander";
import { buildInfoProps } from "./context";
import docs from "./docs";
import { display } from "./components/application";
import { Logs } from "./components/Logs";

export default new Command()
  .command("logs [packageName] [stackName]")
  .description("Stream real time logs or search cloud stored logs.")
  .on("--help", () => {
    console.log(docs("logs.md"));
  })
  .action(async (packageName, stackName) => {
    display(await buildInfoProps(packageName, stackName), Logs);
    return;
  });
