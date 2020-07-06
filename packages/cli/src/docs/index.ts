import fs from "fs-extra";
import marked from "marked";
import TerminalRenderer from "marked-terminal";
import path from "path";

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer(),
});

export const StackName =
  "Name to create stack, or copy of your app -- like dev/test/stage";
export const PackageName = "Name of the app pacakge -- from your pacakge.json";

/**
 * Read and render a markdown file.
 */
export const message = (fileName: string): string => {
  const content = fs.readFileSync(path.resolve(__dirname, fileName), "utf8");
  return marked(content);
};

export const errorMessage = (fileName: string): Error => {
  return new ErrorMessage(message(fileName));
};

/**
 * Our own error message type.
 */
export class ErrorMessage extends Error {}

export default message;
