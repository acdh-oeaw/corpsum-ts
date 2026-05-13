# syntax=docker/dockerfile:1

# using alpine base image to avoid `sharp` memory leaks.
# @see https://sharp.pixelplumbing.com/install#linux-memory-allocator

# build
FROM node:24-slim AS base

RUN corepack enable

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY --chown=node:node .npmrc package.json pnpm-lock.yaml ./

RUN pnpm fetch

COPY --chown=node:node ./ ./

ARG NUXT_PUBLIC_APP_BASE_URL
ARG NUXT_PUBLIC_REDMINE_ID
ARG NUXT_PUBLIC_BOTS
ARG NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ARG NUXT_PUBLIC_MATOMO_BASE_URL
ARG NUXT_PUBLIC_MATOMO_ID

FROM base AS dev
ENV NODE_ENV development
RUN CI=true pnpm install

EXPOSE 3000

CMD [ "pnpm", "run", "dev"]

FROM base AS build

RUN CI=true pnpm install --frozen-lockfile --offline

ENV NODE_ENV=production

# to mount secrets which need to be available at build time
# @see https://docs.docker.com/build/building/secrets/
RUN --mount=type=secret,id=DATABASE_URL,uid=1000 \
    --mount=type=secret,id=NUXT_AUTH_SECRET,uid=1000 \
    --mount=type=secret,id=NUXT_CREDENTIAL_SECRET,uid=1000 \
    --mount=type=secret,id=NUXT_JWT_EXPIRATION,uid=1000 \
    DATABASE_URL=$(cat /run/secrets/DATABASE_URL) \
    NUXT_AUTH_SECRET=$(cat /run/secrets/NUXT_AUTH_SECRET) \
    NUXT_CREDENTIAL_SECRET=$(cat /run/secrets/NUXT_CREDENTIAL_SECRET) \
    NUXT_JWT_EXPIRATION=$(cat /run/secrets/NUXT_JWT_EXPIRATION) \
    pnpm run build

# serve
FROM node:24-alpine AS serve

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY --from=build --chown=node:node /app/.output ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "./server/index.mjs"]
