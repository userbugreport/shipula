import { Command } from "commander";
import docs from "./docs";
import { buildInfoProps, buildEnvProps } from "./context";
import { EnvSet } from "./components/EnvSet";
import { display } from "./components/application";
import { EnvGet } from "./components/EnvGet";

const getCommand = new Command()
  .command("get [packageDirectory] [stackName]")
  .action(async (packageDirectory, stackName) => {
    await display(await buildInfoProps(packageDirectory, stackName), EnvGet);
    return;
  });

const setCommand = new Command()
  .command("set [packageDirectory] [stackName] [variables...]")
  .action(
    async (
      packageDirectory: string,
      stackName: string,
      variables: string[]
    ) => {
      const props = await buildEnvProps(packageDirectory, stackName, variables);
      await display(props, EnvSet);
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
