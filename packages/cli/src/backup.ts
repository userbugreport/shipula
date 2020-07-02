import { Command } from "commander";
import docs from "./docs";

export default new Command()
  .command("backup")
  .description(
    "Creates a backup copy of your App/Stack file system, and provides a link where you can download it."
  )
  .on("--help", () => {
    console.log(docs("backup.md"));
  })
  .action(async () => {
    return;
  });
