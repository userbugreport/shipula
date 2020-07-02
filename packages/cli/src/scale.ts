import { Command } from "commander";
import docs from "./docs";

export default new Command()
  .command("scale")
  .description("Set scaling limits on your App Stack.")
  .on("--help", () => {
    console.log(docs("scale.md"));
  })
  .action(async () => {
    return;
  });
