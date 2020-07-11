import { Command } from "commander";
import { buildInfoProps } from "./context";
import docs from "./docs";
import { display } from "./components/application";
import { Logs } from "./components/Logs";

export default new Command()
  .command("logs [packageDirectory] [stackName]")
  .description("Stream real time logs or search cloud stored logs.")
  .on("--help", () => {
    console.log(docs("logs.md"));
  })
  .action(async (packageDirectory, stackName) => {
    const props = packageDirectory
      ? await buildInfoProps(packageDirectory, stackName)
      : {};
    await display(props, Logs);
    return;
  });
