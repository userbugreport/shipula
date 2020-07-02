import { Command } from "commander";
import docs from "./docs";

export default new Command()
  .command("logs")
  .description("Stream real time logs or search cloud stored logs.")
  .option(
    "--search <query>",
    "Search for this content in log messages, returning matches "
  )
  .on("--help", () => {
    console.log(docs("logs.md"));
  })
  .action(async () => {
    return;
  });
