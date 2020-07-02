import { Command } from "commander";
import docs from "./docs";
import { display } from "./components/application";
import { ShipulaContextProps } from "./context";
import { Info } from "./components/Info";

export default new Command()
  .command("info")
  .description("This will tell you all about your App and Stack.")
  .on("--help", () => {
    console.log(docs("info.md"));
  })
  .action(async (command) => {
    display(command?.parent as ShipulaContextProps, Info);
  });
