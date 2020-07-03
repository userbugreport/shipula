import fs from "fs-extra";
import marked from "marked";
import TerminalRenderer from "marked-terminal";
import path from "path";

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer(),
});

export const StackName =
  "Optional name to create another stack, or copy of your app -- like dev/test/stage";
export const AppName =
  "Optional name of the app, used when in a multirepo to target a pacakge";

/**
 * Read and render a markdown file.
 */
export default (fileName: string): string => {
  const content = fs.readFileSync(path.resolve(__dirname, fileName), "utf8");
  return marked(content);
};
