import fs from "fs-extra";
import assert from "assert";
import path from "path";
import { ErrorMessage } from "./errors";

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
    build?: string;
    start?: string;
    prepublish?: string;
  };

  /**
   * Shipula specific settings.
   */
  shipula?: {
    /**
     * When provided, this relative directory will be deployed as a static site.
     */
    static?: string;
  };
};

/**
 * Load -- just throws if there are any problems at all.
 */
export const loadPackage = (filename?: string): Package => {
  const defaultToWorkingDirectory = filename || ".";
  const forgiveDirectory = path.resolve(
    path.basename(defaultToWorkingDirectory, ".json") === "package"
      ? defaultToWorkingDirectory
      : path.join(defaultToWorkingDirectory, "package.json")
  );
  try {
    const p = fs.readJsonSync(forgiveDirectory) as Package;
    p.from = path.dirname(forgiveDirectory);
    assert(p.name, "Must have a name in your package.");
    assert(p.version, "Must have a version in your package");
    assert(
      p?.scripts?.start,
      "Must have a scripts section with a start command in your pacakge"
    );
    return p;
  } catch (e) {
    const err: Error = e;
    if (err.message.startsWith("ENOENT"))
      throw new ErrorMessage(
        `No \`package.json\` could be found at the path you provided \`${forgiveDirectory}\`.`
      );
    throw e;
  }
};
