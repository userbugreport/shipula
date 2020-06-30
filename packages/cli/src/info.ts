import { Command } from "commander";
import docs from "./docs";
import { display } from "./components/application";

export default new Command()
  .command("info [packageName]")
  .description("This will tell you all about your App.")
  .on("--help", () => {
    console.log(docs("info.md"));
  })
  .action(async (packageName) => {
    display({ packageName });
  });
