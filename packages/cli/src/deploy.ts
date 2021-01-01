import { Command } from "commander";
import docs from "./docs";
import { Deploy } from "./components/Deploy";
import { buildDeployProps } from "./context";
import { display } from "./components/application";

export default new Command()
  .command("deploy [packageDirectory] [stackName]")
  .description("Deploys your package to the cloud, creating an App and Stack.")
  .on("--help", () => {
    console.log(docs("deploy.md"));
  })
  .action(async (packageDirectory: string, stackName: string) => {
    await display(await buildDeployProps(packageDirectory, stackName), Deploy);
    return;
  });
