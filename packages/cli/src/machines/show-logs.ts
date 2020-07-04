import { Machine, actions } from "xstate";
import { ShipulaContextProps } from "../context";
import AWS, { CloudWatchLogs } from "aws-sdk";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    fetchingLogGroups: NoSubState;
    fetchingLogStreams: NoSubState;
    streaming: NoSubState;
    done: NoSubState;
  };
}

/**
 * Expand the context a bit to keep track of next
 * tokens.
 */
type Context = ShipulaContextProps & {
  nextTokens: {
    [index: string]: string;
  };
  logGroups: CloudWatchLogs.LogGroup[];
  logStreams: (CloudWatchLogs.LogGroup & CloudWatchLogs.LogStream)[];
};

type Events = never;

/**
 * CDK needs a toolkit stack.
 */
export default Machine<Context, Schema, Events>({
  id: "cdktoolkit",
  initial: "fetchingLogGroups",
  states: {
    fetchingLogGroups: {
      invoke: {
        src: async (context) => {
          // get all the shipula log groups
          const cloudWatch = new AWS.CloudWatchLogs();
          context.logGroups = [];

          const moreLogs = async (
            nextToken: string
          ): Promise<CloudWatchLogs.DescribeLogGroupsResponse> => {
            return new Promise((resolve, reject) => {
              cloudWatch.describeLogGroups(
                {
                  logGroupNamePrefix: "shipula",
                  nextToken: nextToken === "-" ? undefined : nextToken,
                  limit: 1,
                },
                (err, data) => {
                  if (err) reject(err);
                  else resolve(data);
                }
              );
            });
          };
          let token = "-";
          // more to fetch...
          while (token) {
            const { logGroups, nextToken } = await moreLogs(token);
            context.logGroups = [...context.logGroups, ...logGroups];
            token = nextToken;
          }
          // no news is good news -- the context is updated
        },
        onDone: "fetchingLogStreams",
        onError: {
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
          target: "done",
        },
      },
    },
    fetchingLogStreams: {
      invoke: {
        src: async (context) => {
          // get all the shipula log streams for each group
          const cloudWatch = new AWS.CloudWatchLogs();
          context.logStreams = [];
          for (const logGroup of context.logGroups) {
            const moreStreams = async (
              nextToken: string
            ): Promise<CloudWatchLogs.DescribeLogStreamsResponse> => {
              return new Promise((resolve, reject) => {
                cloudWatch.describeLogStreams(
                  {
                    logGroupName: logGroup.logGroupName,
                    nextToken: nextToken === "-" ? undefined : nextToken,
                    limit: 1,
                  },
                  (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                  }
                );
              });
            };
            let token = "-";
            // more to fetch...
            while (token) {
              const { logStreams, nextToken } = await moreStreams(token);
              context.logStreams = [
                ...context.logStreams,
                ...logStreams.map((logStream) => ({
                  ...logGroup,
                  ...logStream,
                })),
              ];
              token = nextToken;
            }
          }
          // no news is good news -- the context is updated
        },
        onDone: "streaming",
        onError: {
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
          target: "done",
        },
      },
    },
    streaming: {
      invoke: {
        src: async (context) => {
          // and not for all the log events -- these are not saved -- they are emitted
          const cloudWatch = new AWS.CloudWatchLogs();
          for (const logStream of context.logStreams) {
            const moreStreams = async (
              nextToken: string
            ): Promise<CloudWatchLogs.GetLogEventsResponse> => {
              return new Promise((resolve, reject) => {
                cloudWatch.getLogEvents(
                  {
                    logGroupName: logStream.logGroupName,
                    logStreamName: logStream.logStreamName,
                    startFromHead: true,
                    nextToken: nextToken === "-" ? undefined : nextToken,
                    limit: 1,
                  },
                  (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                  }
                );
              });
            };
            let token = "-";
            // more to fetch...
            while (token) {
              const { events, nextForwardToken } = await moreStreams(token);
              token = nextForwardToken;
              events.forEach((event) => {
                console.log(event.message);
              });
            }
          }
        },
        onDone: "streaming",
        onError: {
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
        },
      },
    },
    done: { type: "final" },
  },
});
