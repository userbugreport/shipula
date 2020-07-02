import { Command } from "commander";
import docs from "./docs";
import { Deploy } from "./components/Deploy";
import { ShipulaContextProps } from "./context";
import { display } from "./components/application";

export default new Command()
  .command("deploy")
  .description("Deploys your pacakge to the cloud, creating and App and Stack.")
  .on("--help", () => {
    console.log(docs("deploy.md"));
  })
  .action(async (command) => {
    // validate login with 'our app'
    display(command?.parent as ShipulaContextProps, Deploy);


    return;
  });
