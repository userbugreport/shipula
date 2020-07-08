import backup from "../src/backup";
import deploy from "../src/deploy";
import destroy from "../src/destroy";
import env from "../src/env";
import info from "../src/info";
import logs from "../src/logs";
import scale from "../src/scale";
import dns from "../src/dns";

const commands = {
  backup,
  deploy,
  destroy,
  env,
  info,
  logs,
  scale,
  dns,
};

describe("CLI", () => {
  describe("sub commands", () => {
    describe.each(Object.keys(commands))("%s", (commandName) => {
      test("help strings", () => {
        expect(commands[commandName].helpInformation()).toMatchSnapshot();
      });
    });
  });
});
