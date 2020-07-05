import fs from "fs-extra";
import path from "path";
import assert from "assert";

/**
 * A specific node package. We don't need all the properties
 * of `package.json`, just the few we care about.
 */
export type Package = {
  /**
   * This needs to be from somewhere on disk.
   */
  from?: string;
  /**
   * Gotta call it something. This is the source, uncleaned names.
   */
  name: string;

  /**
   * Pull the version string through to be a nice guy Ui friend -- this
   * is useful for display and for tagging cloud resources.
   */
  version?: string;

  /**
   * Need a start script to exist.
   */
  scripts?: {
    start?: string;
  };
};

/**
 * Load -- just throws if there are ny problems at all.
 */
export const loadPackage = async (filename?: string): Promise<Package> => {
  const defaultToWorkingDirectory = filename || ".";
  const forgiveDirectory =
    path.basename(defaultToWorkingDirectory, ".json") === "package"
      ? path.resolve(defaultToWorkingDirectory)
      : path.resolve(defaultToWorkingDirectory, "package.json");
  const p = (await fs.readJson(forgiveDirectory)) as Package;
  p.from = path.dirname(forgiveDirectory);
  assert(p.name, "Must have a name in your package.");
  assert(p.version, "Must have a version in your package");
  assert(
    p?.scripts?.start,
    "Must have a scripts section with a start command in your pacakge"
  );
  return p;
};
