import { Command } from "commander";
import docs from "./docs";

export default new Command()
  .command("destroy [package]")
  .description("This will tell you all about your App.")
  .on("--help", () => {
    console.log(docs("info.md"));
  })
  .action(async () => {
    return;
  });
