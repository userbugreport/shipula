import { Command } from "commander";
import docs, { StackName } from "./docs";
import { Deploy } from "./components/Deploy";
import { buildDeployProps } from "./context";
import { display } from "./components/application";

export default new Command()
  .command("deploy [packageDirectory]")
  .description("Deploys your pacakge to the cloud, creating and App and Stack.")
  .option("--stackName <stackName>", StackName, "default")
  .on("--help", () => {
    console.log(docs("deploy.md"));
  })
  .action(async (packageDirectory: string, command) => {
    display(
      await buildDeployProps(packageDirectory, command.stackName),
      Deploy
    );
    return;
  });
