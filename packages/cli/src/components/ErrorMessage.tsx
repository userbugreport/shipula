import React from "react";
import { Text } from "ink";

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
  return (
    <>
      <Text color="red" bold>
        {error?.message}
      </Text>
      <Text>{error?.stack}</Text>
    </>
  );
};
