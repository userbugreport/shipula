import React from "react";
import { render } from "ink";
import Spinner from "ink-spinner";
import { Context } from "./context";

const View: React.FunctionComponent<Context> = () => {
  return <Spinner type="dots" />;
};

export const display = (context: Context): void => {
  render(<View {...context} />);
};
