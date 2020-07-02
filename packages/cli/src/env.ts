import { Command } from "commander";
import docs from "./docs";

export default new Command()
  .command("env [package]")
  .description("Manage environment variables for an App/Stack.")
  .on("--help", () => {
    console.log(docs("env.md"));
  })
  .action(async () => {
    return;
  });
