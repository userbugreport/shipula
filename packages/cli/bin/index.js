#!/usr/bin/env node

// bootstrap typescript from the command line without a prebuild
require("ts-node").register({
  /* options */
});
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

const program = require(path.join(__dirname, "..", "src", "index")).program;
/**
 * Our little command line interface. This can be used from Docker -- which is the
 * intended use, or with `yarn cli` for development and testing.
 */
const main = async () => {
  // GO!
  await program.parseAsync(process.argv);
};
// load and go
main();
