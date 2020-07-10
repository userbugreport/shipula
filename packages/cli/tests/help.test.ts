import backup from "../src/backup";
import deploy from "../src/deploy";
import destroy from "../src/destroy";
import env from "../src/env";
import info from "../src/info";
import logs from "../src/logs";
import scale from "../src/scale";
import dns from "../src/dns";
import fs from "fs-extra";
import path from "path";

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
        const helpInfo = commands[commandName].helpInformation();
        expect(helpInfo).toMatchSnapshot();
        // and let's update the docs while we are here...
        fs.writeFileSync(
          path.join(
            __dirname,
            "..",
            "..",
            "docs",
            "docs",
            "commands",
            `${commandName}.mdx`
          ),
          `---
Title: ${commandName}
---

\`\`\`shell
${helpInfo}
\`\`\`
`
        );
      });
    });
  });
});
