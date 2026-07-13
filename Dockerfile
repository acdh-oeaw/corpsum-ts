# syntax=docker/dockerfile:1

# using alpine base image to avoid `sharp` memory leaks.
# @see https://sharp.pixelplumbing.com/install#linux-memory-allocator

# build
FROM node:24-slim AS base

ENV COREPACK_HOME=/opt/corepack

RUN corepack enable && mkdir "$COREPACK_HOME" && chown node:node "$COREPACK_HOME"

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

RUN corepack install --global pnpm@11.0.4

COPY --chown=node:node .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Keep dependency lifecycle work cacheable independently of the application source.
RUN --mount=type=cache,id=pnpm-store,target=/home/node/.local/share/pnpm/store,uid=1000,gid=1000 \
	npm pkg delete scripts.preinstall scripts.postinstall scripts.prepare && \
	CI=true pnpm install --frozen-lockfile

COPY --chown=node:node ./ ./

RUN CI=true pnpm run postinstall

FROM base AS dev
ENV NODE_ENV=development

EXPOSE 3000

CMD [ "pnpm", "run", "dev"]

FROM base AS build

ARG NUXT_PUBLIC_APP_BASE_URL
ARG NUXT_PUBLIC_REDMINE_ID
ARG NUXT_PUBLIC_BOTS
ARG NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ARG NUXT_PUBLIC_MATOMO_BASE_URL
ARG NUXT_PUBLIC_MATOMO_ID
ARG NUXT_OAUTH_GITHUB_CLIENT_ID

ENV NODE_ENV=production

# to mount secrets which need to be available at build time
# @see https://docs.docker.com/build/building/secrets/
RUN --mount=type=secret,id=DATABASE_URL,uid=1000 \
    --mount=type=secret,id=NUXT_AUTH_SECRET,uid=1000 \
    --mount=type=secret,id=NUXT_CREDENTIAL_SECRET,uid=1000 \
    --mount=type=secret,id=NUXT_JWT_EXPIRATION,uid=1000 \
    --mount=type=secret,id=NUXT_OAUTH_GITHUB_CLIENT_SECRET,uid=1000 \
    DATABASE_URL=$(cat /run/secrets/DATABASE_URL) \
    NUXT_AUTH_SECRET=$(cat /run/secrets/NUXT_AUTH_SECRET) \
    NUXT_CREDENTIAL_SECRET=$(cat /run/secrets/NUXT_CREDENTIAL_SECRET) \
    NUXT_JWT_EXPIRATION=$(cat /run/secrets/NUXT_JWT_EXPIRATION) \
    NUXT_OAUTH_GITHUB_CLIENT_SECRET=$(cat /run/secrets/NUXT_OAUTH_GITHUB_CLIENT_SECRET) \
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
