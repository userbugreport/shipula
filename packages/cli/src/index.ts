import { Command } from "commander";
import pj from "../package.json";
import deploy from "./deploy";
import destroy from "./destroy";
import env from "./env";
import info from "./info";
import backup from "./backup";
import logs from "./logs";
import scale from "./scale";
import dns from "./dns";
import { ErrorMessage } from "./docs";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const buildProgram = async () => {
  const program = new Command();
  program
    .version(pj.version)
    .description(
      `⛴🧛🏻‍♂️-- Make **works-on-cloud** as easy as *works-on-my-machine*.`
    )
    .addCommand(deploy)
    .addCommand(destroy)
    .addCommand(env)
    .addCommand(info)
    .addCommand(backup)
    .addCommand(logs)
    .addCommand(dns)
    .addCommand(scale);
  return program;
};
/**
 * Our little command line interface. This can be used from Docker -- which is the
 * intended use, or with `yarn cli` for development and testing.
 */
export const main = async (): Promise<void> => {
  // GO!
  try {
    const program = await buildProgram();
    if (process.argv.length === 2) process.argv.push("--help");
    await program.parseAsync(process.argv);
  } catch (e) {
    if (e instanceof ErrorMessage) {
      // these messages are 'handled' in the sense that we threw them
      // on purpose and have custom messages -- so no stack trace
      console.log((e as ErrorMessage).message);
    } else {
      console.log(e);
    }
  }
};

if (require.main === module) main();
