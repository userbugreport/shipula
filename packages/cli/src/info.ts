import { Command } from "commander";
import docs from "./docs";
import { Info } from "./components/Info";
import { display } from "./components/application";
import { buildInfoProps } from "./context";

export default new Command()
  .command("info [packageDirectory] [stackName]")
  .description("This will tell you all about your App and Stack.")
  .on("--help", () => {
    console.log(docs("destroy.md"));
  })
  .action(async (packageDirectory, stackName) => {
    const props = packageDirectory
      ? await buildInfoProps(packageDirectory, stackName)
      : {};
    display(props, Info);
    return;
  });
