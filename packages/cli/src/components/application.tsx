import React from "react";
import { render } from "ink";
import { ShipulaContext } from "../context";
import { Authenticator } from "./authenticator";
import { ShipulaContextProps } from "@shipula/context";

type Props = {
  initialValues: ShipulaContextProps;
};

/**
 * Root application object, context and authentication is provided.
 */
const Application: React.FunctionComponent<Props> = ({
  initialValues,
  children,
}: React.PropsWithChildren<Props>) => {
  // context is state to allow an update
  const [contextState, setContextState] = React.useState<ShipulaContextProps>(
    initialValues
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
export const display = async (
  initialValues: ShipulaContextProps,
  Display: React.FunctionComponent
): Promise<void> => {
  // start Ink rendering
  const instance = render(
    <Application initialValues={initialValues}>
      <Display />
    </Application>
  );
  await instance.waitUntilExit();
};
