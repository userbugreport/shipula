import { Command } from "commander";
import pj from "../package.json";
import deploy from "./deploy";
import destroy from "./destroy";
import env from "./env";
import info from "./info";
import backup from "./backup";
import logs from "./logs";
import scale from "./scale";
import walk from "ignore-walk";
import fs from "fs-extra";
import path from "path";

/**
 * A package we found to deploy as an app.
 */
export type Package = {
  path: string;
  name: string;
};

/**
 * Look for all the packages, and get the possible package names.
 * This is how we decide what to deploy.
 */
export const listPackages = async (): Promise<Package[]> => {
  const IGNORE = ".shipulaignore";
  if (!(await fs.pathExists(IGNORE))) {
    await fs.writeFile(IGNORE, "node_modules");
  }
  const files = walk.sync({
    ignoreFiles: [".gitignore", IGNORE],
  });
  const packageFiles = files.filter(
    (fileName) => path.basename(fileName, ".json") === "package"
  );
  return Promise.all(
    packageFiles.map(async (packageFileName) => ({
      path: packageFileName,
      name: (await fs.readJSON(packageFileName)).name,
    }))
  );
};

export const StackName =
  "Optional name to create another stack, or copy of your app -- like dev/test/stage";
export const AppName =
  "Optional name of the app, used when in a multirepo to target a pacakge";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const buildProgram = async () => {
  const packages = await listPackages();
  const program = new Command();
  program
    .version(pj.version)
    .description(`⛴🧛🏻‍♂️-- The simplest way to get your node server to the cloud!`)
    .option(
      "--packageName <packageName>",
      StackName,
      packages.length ? packages[0].name : "no package found"
    )
    .option("--stackName <stackName>", StackName, "default")
    .addCommand(deploy)
    .addCommand(destroy)
    .addCommand(env)
    .addCommand(info)
    .addCommand(backup)
    .addCommand(logs)
    .addCommand(scale);
  return program;
};
