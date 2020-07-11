import { Command } from "commander";
import docs from "./docs";
import { buildEnvProps } from "./context";
import { DnsDomain } from "./components/DnsDomain";
import { display } from "./components/application";
import { EnvSet } from "./components/EnvSet";
import { Info } from "@shipula/context";

const domainCommand = new Command()
  .command("domain <domainName>")
  .action(async (domainName) => {
    await display({ domainName }, DnsDomain);
    return;
  });

const nameCommand = new Command()
  .command("name <hostName> <packageDirectory>] [stackName]")
  .action(
    async (hostName: string, packageDirectory: string, stackName: string) => {
      const props = await buildEnvProps(packageDirectory, stackName);
      props.setVariables = { SHIPULA_HOST_NAME: hostName };
      props.domainName = Info.domainName(hostName);
      // do the domain name verification
      await display(props, DnsDomain);
      // and then go ahead and update the env to set a host name
      await display(props, EnvSet);
      return;
    }
  );

export default new Command()
  .command("dns")
  .description("Manage custom domain names.")
  .on("--help", () => {
    console.log(docs("env.md"));
  })
  .addCommand(domainCommand)
  .addCommand(nameCommand);
