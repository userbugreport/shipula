import { Command } from "commander";
import docs from "./docs";
import { buildInfoProps } from "./context";
import { display } from "./components/application";
import { Backup } from "./components/Backup";

const take = new Command()
  .command("take [packageDirectory] [stackName]")
  .description(
    "Creates a backup copy of your App/Stack file system, and provides a link where you can download it."
  )
  .action(async (packageDirectory, stackName) => {
    const props = packageDirectory
      ? await buildInfoProps(packageDirectory, stackName)
      : {};
    display(props, Backup);
    return;
  });

const restore = new Command()
  .command("restore [packageDirectory] [stackName]")
  .description("Restore a backup to your App/Stack file system")
  .action(async (packageDirectory, stackName) => {
    const props = packageDirectory
      ? await buildInfoProps(packageDirectory, stackName)
      : {};
    display(props, Backup);
    return;
  });

export default new Command()
  .command("backup")
  .description("Manage backups of your App/Stack shared file system.")
  .on("--help", () => {
    console.log(docs("backup.md"));
  })
  .addCommand(take)
  .addCommand(restore);
