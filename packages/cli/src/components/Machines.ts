/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Machine, actions } from "xstate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

/**
 * Data loading state machine.
 */
interface LoadingSchema {
  states: {
    loading: NoSubState;
    loaded: NoSubState;
    displayingError: NoSubState;
  };
}

type LoadingContext<T> = {
  lastError?: Error;
  data?: T;
};

/**
 * No events on the loading machine -- it's just a promise
 */
type LoadingEvents = never;
/**
 * The loading promise machine.
 */
export const LoadingMachine = <T>() =>
  Machine<LoadingContext<T>, LoadingSchema, LoadingEvents>({
    initial: "loading",
    states: {
      loading: {
        invoke: {
          src: "readData",
          onDone: {
            target: "loaded",
            actions: actions.assign({
              data: (_context, event) => event?.data,
            }),
          },
          onError: {
            target: "displayingError",
            actions: actions.assign({
              lastError: (_context, event) => event?.data,
            }),
          },
        },
      },
      loaded: {},
      displayingError: {},
    },
  });
