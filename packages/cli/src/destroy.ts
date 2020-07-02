import { Command } from "commander";
import docs from "./docs";
import { Destroy } from "./components/Destroy";
import { ShipulaContextProps } from "./context";
import { display } from "./components/application";

export default new Command()
  .command("destroy")
  .description("Completely remove a Stack from an App")
  .on("--help", () => {
    console.log(docs("destroy.md"));
  })
  .action(async (command) => {
    display(command?.parent as ShipulaContextProps, Destroy);
    return;
  });
