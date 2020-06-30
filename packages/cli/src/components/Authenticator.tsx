import React from "react";
import { Text, Box, useFocus } from "ink";
import { Machine, actions } from "xstate";
import { useMachine } from "@xstate/react";
import { ShipulaContext, ShipulaContextProps } from "../context";
import Spinner from "ink-spinner";
import { AWSRegion, completeCredentials, Credentials } from "../configuration";
import fs from "fs-extra";
import expandTide from "expand-tilde";
import path from "path";
import AWS from "aws-sdk";
import { Form, Field } from "react-final-form";
import InkTextInput from "ink-text-input";

const userHomeConfig = path.join(expandTide("~"), ".shipula.json");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    readingEnvVars: NoSubState;
    readingDotfile: NoSubState;
    promptingUser: NoSubState;
    verifyingCredentials: NoSubState;
    savingCredentials: NoSubState;
    displayingError: NoSubState;
    connected: NoSubState;
  };
}
type Events = {
  type: "HAS_VALUES";
  credentials: Credentials;
};
/**
 * Let's use a state machine to represent the entire application.
 *
 * There are a few dependencies and transitions, particularly in constraint
 * satisfaction -- connecting to AWS and having packages that are suitable
 * to depoy.
 */
const machine = Machine<ShipulaContextProps, Schema, Events>({
  id: "authenticator",
  initial: "readingEnvVars",
  states: {
    // env vars are preferred, so they go first
    readingEnvVars: {
      invoke: {
        src: "readEnvVars",
        onDone: {
          target: "verifyingCredentials",
        },
        onError: {
          target: "readingDotfile",
        },
      },
    },
    // user level preferences
    readingDotfile: {
      invoke: {
        src: "readDotfile",
        onDone: {
          target: "verifyingCredentials",
        },
        onError: {
          target: "promptingUser",
        },
      },
    },
    // user input
    promptingUser: {
      on: {
        HAS_VALUES: {
          target: "verifyingCredentials",
          actions: actions.assign({
            verifiedCredentials: (_context, event) => event.credentials,
          }),
        },
      },
    },
    // time to go out to the network and try
    verifyingCredentials: {
      invoke: {
        src: "connectAWS",
        onDone: {
          target: "savingCredentials",
        },
        onError: {
          target: "displayingError",
          actions: actions.assign({
            lastError: (_context, event) => event.data,
          }),
        },
      },
    },
    // these credentials worked! -- save them so we can use them
    savingCredentials: {
      invoke: {
        src: "saveCredentials",
        onDone: {
          target: "connected",
        },
        // even if we cannot save them -- we are still connected
        onError: {
          target: "displayingError",
          actions: actions.assign({
            lastError: (_context, event) => event.data,
          }),
        },
      },
    },
    // flash error
    displayingError: {
      after: {
        100: "promptingUser",
      },
    },
    connected: { type: "final" },
  },
});

/**
 * Authenticate against AWS.
 *
 * This is a state machine that looks at available credentials, tries
 * to log into AWS, and failing that -- asks the user for working credentials.
 */
export const Authenticator: React.FunctionComponent = () => {
  // app level context is passed along to the state machine level context
  const appContext = React.useContext(ShipulaContext);
  // configured state machine under closure with context
  const [state, send] = useMachine(machine, {
    appContext,
    services: {
      readEnvVars: async (context) => {
        // load up the context with env vars
        context.verifiedCredentials = {
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
          AWS_REGION: (process.env.AWS_REGION as AWSRegion) || "us-east-1",
        };
        if (completeCredentials(context.verifiedCredentials)) return;
        else throw new Error();
      },
      readDotfile: async (context) => {
        if (await fs.pathExists(userHomeConfig)) {
          const userHomeConfigProps = JSON.parse(
            await fs.readFile(userHomeConfig, "utf8")
          ) as Credentials;
          // go ahead and write over if there are values
          context.verifiedCredentials = {
            ...context.verifiedCredentials,
            ...userHomeConfigProps,
          };
          if (completeCredentials(context.verifiedCredentials)) return;
          else throw new Error();
        }
      },
      saveCredentials: async (context) => {
        // we've connected. awesome -- save it -- back to the app context
        appContext.setContextState(context);
        console.log("saving", userHomeConfig, context.verifiedCredentials);
        // and to the user profile
        await fs.writeJSON(userHomeConfig, context.verifiedCredentials);
        return;
      },
      connectAWS: async (context) => {
        // AWS check to cloud formation -- this tells us if
        // there is a real connection
        // transfer the credentials through to the environment varaibles
        process.env.AWS_ACCESS_KEY_ID =
          context.verifiedCredentials.AWS_ACCESS_KEY_ID;
        process.env.AWS_SECRET_ACCESS_KEY =
          context.verifiedCredentials.AWS_SECRET_ACCESS_KEY;
        process.env.AWS_REGION = context.verifiedCredentials.AWS_REGION;
        // everything we're making is going to be a CloudFormation stack
        // so query and see apps -- let exceptions out -- the state
        // machine will handle it
        const cloudFormation = new AWS.CloudFormation();
        await new Promise((resolve, reject) => {
          cloudFormation.listStacks((err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
        context.lastError = null;
      },
    },
  });

  type extractProps<Type> = Type extends React.FunctionComponent<infer X>
    ? X
    : never;

  type InkTextInputProps = extractProps<typeof InkTextInput>;
  type FocusableInkTextInputProps = InkTextInputProps & {
    name: string;
    autoFocus?: boolean;
  };
  /**
   * Focusable text field.
   */
  const FocusableInkTextInput: React.FunctionComponent<FocusableInkTextInputProps> = (
    props: FocusableInkTextInputProps
  ) => {
    const { isFocused } = useFocus({
      autoFocus: props.autoFocus,
    });
    return (
      <Box flexDirection="row">
        <Text>{props.name}: </Text>
        {isFocused ? (
          <InkTextInput {...props} showCursor />
        ) : (
          <Text>{props.value}</Text>
        )}
      </Box>
    );
  };

  const errorMessage = (
    <Text color="red" bold>
      {state.context.lastError?.message}
    </Text>
  );
  const submitCredentials = (credentials: Credentials) => {
    send("HAS_VALUES", {
      credentials,
    });
  };
  const credentialsForm = (
    <Form<Credentials>
      onSubmit={submitCredentials}
      initialValues={state.context.verifiedCredentials}
    >
      {({ handleSubmit }) => (
        <Box flexDirection="column">
          <Field name="AWS_ACCESS_KEY_ID" key="AWS_ACCESS_KEY_ID">
            {({ input }) => (
              <FocusableInkTextInput
                {...input}
                autoFocus
                onSubmit={() => handleSubmit()}
              />
            )}
          </Field>
          <Field name="AWS_SECRET_ACCESS_KEY" key="AWS_SECRET_ACCESS_KEY">
            {({ input }) => (
              <FocusableInkTextInput
                {...input}
                onSubmit={() => handleSubmit()}
              />
            )}
          </Field>
          <Field name="AWS_REGION" key="AWS_REGION">
            {({ input }) => (
              <FocusableInkTextInput
                {...input}
                onSubmit={() => handleSubmit()}
              />
            )}
          </Field>
        </Box>
      )}
    </Form>
  );
  return (
    <>
      {state.value === "verifyingCredentials" && (
        <Text>
          <Spinner type="dots" />
        </Text>
      )}
      {state.context.lastError && errorMessage}
      {state.value === "promptingUser" && credentialsForm}
    </>
  );
};
