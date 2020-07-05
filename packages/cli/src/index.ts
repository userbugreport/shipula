import { Command } from "commander";
import pj from "../package.json";
import deploy from "./deploy";
import destroy from "./destroy";
import env from "./env";
import info from "./info";
import backup from "./backup";
import logs from "./logs";
import scale from "./scale";

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
    .addCommand(scale);
  return program;
};
