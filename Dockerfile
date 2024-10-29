# syntax=docker/dockerfile:1

# build
FROM node:22-slim AS base

RUN corepack enable

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY --chown=node:node .npmrc package.json pnpm-lock.yaml ./

RUN pnpm fetch

COPY --chown=node:node nuxt.config.ts tailwind.config.ts tsconfig.json ./
COPY --chown=node:node public ./public
COPY --chown=node:node src ./src

ARG NUXT_PUBLIC_APP_BASE_URL
ARG NUXT_PUBLIC_REDMINE_ID
ARG NUXT_PUBLIC_MATOMO_BASE_URL
ARG NUXT_PUBLIC_MATOMO_ID
ARG DATABASE_HOST
ARG DATABASE_NAME
ARG DATABASE_USER
ARG DATABASE_PASSWORD
ARG DATABASE_AUTHSOURCE
ARG AUTH_SECRET

FROM base as dev
ENV NODE_ENV development
RUN pnpm install

EXPOSE 3000

CMD [ "pnpm", "run", "dev"]

FROM base as build
RUN pnpm install --frozen-lockfile --offline
ENV NODE_ENV=production
RUN pnpm run build

# serve
FROM node:22-slim AS serve

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY --from=build --chown=node:node /app/.output ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "./server/index.mjs"]
