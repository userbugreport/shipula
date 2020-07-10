import marked from "marked";
import TerminalRenderer from "marked-terminal";

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer(),
});

/**
 * Our own error message type, with inline markdown.
 */
export class ErrorMessage extends Error {
  constructor(message: string) {
    super(marked(message));
  }
}
