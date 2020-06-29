import { Command } from "commander";
import docs from "./docs";
import { buildContext } from "./context";
import { display } from "./info-view";

export default new Command()
  .command("info [package]")
  .description("This will tell you all about your App.")
  .on("--help", () => {
    console.log(docs("info.md"));
  })
  .action(async () => {
    display(await buildContext());
  });
