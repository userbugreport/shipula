import { Command } from "commander";
import docs from "./docs";
import { buildInfoProps } from "./context";
import { Info } from "./components/Info";
import { display } from "./components/application";

const getCommand = new Command()
  .command("get [packageName] [stackName]")
  .action(async (packageName, stackName) => {
    display(await buildInfoProps(packageName, stackName), Info);
    return;
  });

const setCommand = new Command()
  .command("set [packageName] [stackName] [variables...]")
  .action(async (packageName, stackName, variables) => {
    console.assert(variables);
    display(await buildInfoProps(packageName, stackName), Info);
    return;
  });

export default new Command()
  .command("env")
  .description("Manage environment variables for an App/Stack.")
  .on("--help", () => {
    console.log(docs("env.md"));
  })
  .addCommand(getCommand)
  .addCommand(setCommand);
