import { Command } from "commander";
import docs from "./docs";
import { Deploy } from "./components/Deploy";
import { buildDeployProps } from "./context";
import { display } from "./components/application";

export default new Command()
  .command("deploy [packageDirectory] [stackName]")
  .description("Deploys your pacakge to the cloud, creating and App and Stack.")
  .on("--help", () => {
    console.log(docs("deploy.md"));
  })
  .action(async (packageDirectory: string, stackName: string) => {
    display(await buildDeployProps(packageDirectory, stackName), Deploy);
    return;
  });
