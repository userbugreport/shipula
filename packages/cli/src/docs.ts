import fs from "fs-extra";
import marked from "marked";
import TerminalRenderer from "marked-terminal";
import path from "path";

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer(),
});

/**
 * Read and render a markdown file.
 */
export default (fileName: string): string => {
  const content = fs.readFileSync(path.resolve(__dirname, fileName), "utf8");
  return marked(content);
};
