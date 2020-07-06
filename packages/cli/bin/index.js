#!/usr/bin/env node

// bootstrap typescript from the command line without a prebuild
require("ts-node").register({
  /* options */
});
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

const { buildProgram, main } = require(path.join(
  __dirname,
  "..",
  "src",
  "index"
));
// load and go
main();
