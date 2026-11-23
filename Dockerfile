# syntax=docker/dockerfile:1

# using alpine base image to avoid `sharp` memory leaks.
# @see https://sharp.pixelplumbing.com/install#linux-memory-allocator

# build
FROM node:26-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

ENV COREPACK_HOME=/opt/corepack

RUN npm install --global corepack@0.36.0 && corepack enable && \
	mkdir "$COREPACK_HOME" && chown node:node "$COREPACK_HOME"

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

ENV NODE_ENV=production

RUN pnpm run build

# serve
FROM node:26-alpine AS serve

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY --from=build --chown=node:node /app/.output ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "./server/index.mjs"]
