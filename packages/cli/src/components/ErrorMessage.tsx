import React from "react";
import { Text, useApp } from "ink";

type Props = {
  /**
   * Just the error you want to show.
   */
  error: Error;
};

/**
 * Snippet to display an error message.
 */
export const ErrorMessage: React.FunctionComponent<Props> = ({
  error,
}: Props) => {
  const app = useApp();
  React.useEffect(() => {
    app.exit(error);
  }, []);
  return (
    <>
      <Text color="red" bold>
        {error?.message}
      </Text>
      <Text>{error?.stack}</Text>
    </>
  );
};
