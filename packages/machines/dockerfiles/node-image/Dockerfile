FROM node:12

ARG PREPUBLISH
ARG BUILD

WORKDIR /app
COPY . .

# If you have native dependencies, you'll need extra tools
# RUN apk add --no-cache make gcc g++ python

RUN yarn
RUN if [ "${BUILD}" = "YES" ]; then yarn build; fi
RUN if [ "${PREPUBLISH}" = "YES" ]; then yarn prepublish; fi

# expect that the processes honor the port variable
# this needs to match up with what we tell ECS
ENV PORT=8000
ENV CLUSTER_SHARED="/cluster_shared"

CMD ["yarn", "start"]