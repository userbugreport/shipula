#!/usr/bin/env node

require("ts-node").register({});
const path = require("path");
const { main } = require(path.join(__dirname, "..", "src"));

// load and go
main();
