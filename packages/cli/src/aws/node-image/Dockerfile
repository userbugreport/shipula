FROM mhart/alpine-node:12

ARG PACKAGE_FROM=.

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /app
COPY "${PACKAGE_FROM}" "."

# If you have native dependencies, you'll need extra tools
# RUN apk add --no-cache make gcc g++ python

RUN yarn

# expect that the processes honor the port variable
# this needs to match up with what we tell ECS
ENV PORT=8000

CMD ["yarn", "start"]