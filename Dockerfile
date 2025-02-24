# syntax=docker/dockerfile:1

# using alpine base image to avoid `sharp` memory leaks.
# @see https://sharp.pixelplumbing.com/install#linux-memory-allocator

# build
FROM node:22 AS base

RUN corepack enable

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY --chown=node:node .npmrc package.json pnpm-lock.yaml ./

RUN pnpm fetch

COPY --chown=node:node ./ ./

ARG NUXT_PUBLIC_APP_BASE_URL
ARG NUXT_PUBLIC_REDMINE_ID
ARG NUXT_PUBLIC_MATOMO_BASE_URL
ARG NUXT_PUBLIC_MATOMO_ID
ARG DATABASE_HOST
ARG DATABASE_NAME
ARG DATABASE_USER
ARG DATABASE_PASSWORD
ARG DATABASE_AUTHSOURCE
ARG NUXT_AUTH_SECRET
ARG NUXT_JWT_EXPIRATION

FROM base AS dev
ENV NODE_ENV development
RUN pnpm install

EXPOSE 3000
EXPOSE 4000

CMD [ "pnpm", "run", "dev"]

FROM base AS build
RUN pnpm install --frozen-lockfile --offline

ENV NODE_ENV=production

# to mount secrets which need to be available at build time
# @see https://docs.docker.com/build/building/secrets/
RUN pnpm run build

# serve
FROM node:22-alpine AS serve

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY --from=build --chown=node:node /app/.output ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "./server/index.mjs"]
