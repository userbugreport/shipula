import { Machine, actions } from "xstate";
import { ShipulaContextProps, getStackPath } from "@shipula/context";
import AWS, { CloudWatchLogs } from "aws-sdk";
import Randoma from "randoma";
import chalk from "chalk";
import path from "path";

const PollInterval = 5 * 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NoSubState = any;

interface Schema {
  states: {
    starting: NoSubState;
    fetchingLogGroups: NoSubState;
    fetchingLogStreams: NoSubState;
    streaming: NoSubState;
    displaying: NoSubState;
    refreshing: NoSubState;
    working: NoSubState;
    done: NoSubState;
  };
}

/**
 * Help create log stream output.
 */
type LogStreamOutput = {
  colorizedSource: string;
  colorizer: (string) => string;
};

/**
 * An enhanced log stream to allow formatting and fetching.
 */
type LogStream = CloudWatchLogs.LogGroup &
  CloudWatchLogs.LogStream &
  LogStreamOutput;

/**
 * An event with its source stream.
 */
type LogEvent = {
  logStream: LogStream;
  event: CloudWatchLogs.OutputLogEvent;
};

/**
 * Expand the context a bit to keep track of next
 * tokens.
 */
type Context = ShipulaContextProps & {
  // keep these around so we can re-load the available log streams
  // as compared to storing this on a log stream which would get stomped on reload
  nextTokens: {
    [index: string]: string;
  };
  logGroups: CloudWatchLogs.LogGroup[];
  logStreams: LogStream[];
  cycleCounter: number;
  logEvents: LogEvent[];
};

type Events = never;

/**
 * CDK needs a toolkit stack.
 */
export default Machine<Context, Schema, Events>({
  id: "cdktoolkit",
  initial: "starting",
  states: {
    starting: {
      invoke: {
        src: async (context) => {
          context.nextTokens = {};
          context.cycleCounter = 1;
        },
        onDone: "fetchingLogGroups",
        onError: {
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
          target: "done",
        },
      },
    },
    fetchingLogGroups: {
      invoke: {
        src: async (context) => {
          // get all the shipula log groups
          const cloudWatch = new AWS.CloudWatchLogs();
          context.logGroups = [];
          // filter down to a log group name following our rules

          const moreLogs = async (
            nextToken: string
          ): Promise<CloudWatchLogs.DescribeLogGroupsResponse> => {
            return cloudWatch
              .describeLogGroups({
                logGroupNamePrefix: getStackPath(
                  context.package.name,
                  context.stackName
                ),
                nextToken: nextToken === "-" ? undefined : nextToken,
              })
              .promise();
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
          // let's do a promise for each in parallel
          const fetchStreams = async (
            logGroup: CloudWatchLogs.LogGroup
          ): Promise<void> => {
            const moreStreams = async (): Promise<
              CloudWatchLogs.DescribeLogStreamsResponse
            > => {
              return cloudWatch
                .describeLogStreams({
                  logGroupName: logGroup.logGroupName,
                  orderBy: "LastEventTime",
                  descending: true,
                  limit: 10,
                })
                .promise();
            };
            // more to fetch... but really on need the most recent streams
            // so we are ignoring the next token on purpose
            const { logStreams } = await moreStreams();
            context.logStreams = [
              ...context.logStreams,
              ...logStreams.map((logStream) => {
                // generate a 'constant random' colorized source
                const notRandom = new Randoma({
                  seed: logStream.logStreamName,
                });
                const sourceColor = notRandom.color(0.5).hex().toString();
                return {
                  ...logGroup,
                  ...logStream,
                  colorizedSource: chalk.hex(sourceColor)(
                    `${logGroup.logGroupName}/${logStream.logStreamName}`
                  ),
                  colorizer: chalk.hex(sourceColor),
                };
              }),
            ];
          };
          // no news is good news -- the context is updated
          await Promise.all(context.logGroups.map(fetchStreams));
          return;
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
          // buffer all the messages so we can get them in time series
          context.logEvents = new Array<LogEvent>();
          // no loop all the streams and fetch all the events
          // let's do a promise for each in parallel
          const readAStream = async (logStream: LogStream): Promise<void> => {
            const moreStreams = async (
              nextToken: string
            ): Promise<CloudWatchLogs.GetLogEventsResponse> => {
              return new Promise((resolve, reject) => {
                cloudWatch.getLogEvents(
                  {
                    logGroupName: logStream.logGroupName,
                    logStreamName: logStream.logStreamName,
                    startFromHead: true,
                    // starting just about now
                    startTime: Date.now() - 60 * 1000,
                    nextToken: nextToken === "-" ? undefined : nextToken,
                  },
                  (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                  }
                );
              });
            };
            // saving the token in the context, this way we have a cursor
            // into each log stream
            let nextToken =
              context.nextTokens[
                `${logStream.logGroupName}/${logStream.logStreamName}`
              ] || "-";
            // more to fetch...
            while (nextToken) {
              const { events, nextForwardToken } = await moreStreams(nextToken);
              nextToken = context.nextTokens[
                `${logStream.logGroupName}/${logStream.logStreamName}`
              ] = nextForwardToken;
              if (events.length) {
                events.forEach((event) => {
                  context.logEvents.push({ event, logStream });
                });
              } else {
                // let the next stream have a chance
                break;
              }
            }
          };
          return Promise.all(context.logStreams.map(readAStream));
        },
        onDone: "displaying",
        onError: {
          actions: actions.assign({
            lastError: (_context, event) => event?.data,
          }),
        },
      },
    },
    displaying: {
      invoke: {
        src: async (context) => {
          // and done -- this is a complete message loop -- time series
          context.logEvents
            .sort((l, r) => r.event.timestamp - l.event.timestamp)
            .forEach((event) => {
              console.log(
                event.logStream.colorizer(
                  new Date(event.event.timestamp).toISOString()
                ),
                event.logStream.colorizer(
                  path.basename(
                    `${event.logStream.logGroupName}/${event.logStream.logStreamName}`
                  )
                ),
                event.event.message
              );
            });
        },
        onDone: "refreshing",
        onError: "fetchingLogGroups",
      },
    },
    refreshing: {
      invoke: {
        src: async (context) => {
          if (context.cycleCounter % 10 === 0)
            throw new Error("Need to refresh");
          // no news is good news
        },
        onDone: "working",
        onError: "fetchingLogGroups",
      },
    },
    working: {
      after: {
        [PollInterval]: "streaming",
      },
    },
    done: { type: "final" },
  },
});
