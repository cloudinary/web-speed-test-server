FROM node:16.14.2-alpine3.15 AS builder

WORKDIR /usr/src/app

# Copy source files
COPY . .

RUN yarn install --frozen-lockfile

# Expose network
EXPOSE 3000

FROM builder AS dev

# Start server for dev mode
CMD yarn start

FROM builder AS final

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/ ./

ENV TASK=""

CMD  yarn start