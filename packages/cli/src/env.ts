import { Command } from "commander";
import docs from "./docs";
import { buildInfoProps, buildEnvProps } from "./context";
import { Info } from "./components/Info";
import { EnvSet } from "./components/EnvSet";
import { display } from "./components/application";

const getCommand = new Command()
  .command("get [packageName] [stackName]")
  .action(async (packageName, stackName) => {
    display(await buildInfoProps(packageName, stackName), Info);
    return;
  });

const setCommand = new Command()
  .command("set [packageName] [stackName] [variables...]")
  .action(
    async (packageName: string, stackName: string, variables: string[]) => {
      const props = await buildEnvProps(packageName, stackName, variables);
      console.log(props);
      display(props, EnvSet);
      return;
    }
  );

export default new Command()
  .command("env")
  .description("Manage environment variables for an App/Stack.")
  .on("--help", () => {
    console.log(docs("env.md"));
  })
  .addCommand(getCommand)
  .addCommand(setCommand);
