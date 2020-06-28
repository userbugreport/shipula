import { Command } from "commander";
import docs from "./docs";
import { getConfig } from "./configuration";

export default new Command()
  .command("info [package]")
  .description("This will tell you all about your App.")
  .on("--help", () => {
    console.log(docs("info.md"));
  })
  .action(async () => {
    const config = await getConfig();
    console.log(config);
    return;
  });
