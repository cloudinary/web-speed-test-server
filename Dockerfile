FROM node:16.14.2-alpine3.15 AS builder

WORKDIR /usr/src/app

# Copy source files
COPY . .

# RUN npm install -g yarn
RUN yarn install --frozen-lockfile

# Expose network
EXPOSE 3000

CMD yarn start