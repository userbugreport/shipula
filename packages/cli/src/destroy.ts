import { Command } from "commander";
import docs from "./docs";
import { Destroy } from "./components/Destroy";
import { display } from "./components/application";
import { buildInfoProps } from "./context";

export default new Command()
  .command("destroy [packageDirectory] [stackName]")
  .description("Completely remove a Stack from an App")
  .on("--help", () => {
    console.log(docs("destroy.md"));
  })
  .action(async (packageDirectory, stackName) => {
    await display(await buildInfoProps(packageDirectory, stackName), Destroy);
    return;
  });
