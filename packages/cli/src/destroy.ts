import { Command } from "commander";
import docs from "./docs";

export default new Command()
  .command("destroy")
  .description("Completely remove a Stack from an App")
  .on("--help", () => {
    console.log(docs("destroy.md"));
  })
  .action(async () => {
    return;
  });
