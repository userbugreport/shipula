import React from "react";
import { render } from "ink";
import { ShipulaContext, ShipulaContextProps } from "../context";
import { Authenticator } from "./authenticator";

type Props = {
  context: ShipulaContextProps;
};

/**
 * Root application object, context and authentication is provided.
 */
const Application: React.FunctionComponent<Props> = ({
  context,
  children,
}: React.PropsWithChildren<Props>) => {
  // context is state to allow an update
  const [contextState, setContextState] = React.useState<ShipulaContextProps>(
    context
  );
  return (
    <ShipulaContext.Provider value={{ ...contextState, setContextState }}>
      <Authenticator>{children}</Authenticator>
    </ShipulaContext.Provider>
  );
};

/**
 * Main render entry point - this 'starts' the application and is fed arguments
 * and data from the command line through context.
 */
export const display = (context: ShipulaContextProps): void => {
  // start Ink rendering
  render(<Application context={context} />);
};
