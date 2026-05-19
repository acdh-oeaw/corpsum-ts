# Corpsum

Corpsum is a Nuxt 4 application for managing NoSketch Engine instances, queries, and
visualizations. The frontend lives in `app/`; Nitro server routes, MongoDB models, and server-side
helpers live in `server/`; shared/generated types live in `lib/`.

## Architecture

- Nuxt serves the Vue application and Nitro API from the same Node process.
- MongoDB stores users, saved queries, visualizations, NoSketch Engine instances, and per-user
  NoSketch credentials.
- The app does not call NoSketch Engine directly from the browser. Client code talks to
  `/api/noske/:instanceId/**`, and the server resolves the configured instance from MongoDB,
  checks access permissions, decrypts stored credentials when needed, and proxies the request.
- The browser uses one canonical NoSketch API contract: `public/noske.json`. When a configured
  NoSketch instance has version `bonito`, the server proxy rewrites canonical paths to the upstream
  Bonito shape before forwarding. For example, `/search/corp_info` becomes `/corp_info`, and
  `/ca/api/corpora` becomes `/corpora`. Instances with version `openapi` forward canonical paths
  unchanged.
- NoSketch Engine API types are generated from `public/noske.json` into `lib/noske-types.d.ts`.
  `public/noske-bonito.json` is generated as an upstream validation/documentation spec for the
  Bonito translation. To add another NoSketch API variant later, add its generated validation spec,
  extend the instance version enum, and register a server-side path translator.

## Requirements

- [Node.js 24.x](https://nodejs.org/en/download)
- [pnpm 11.0.4](https://pnpm.io/installation)
- Docker and Docker Compose for the local deployment

Corepack can activate the repository pnpm version:

```bash
corepack enable
```

## Local Development

Create the local environment file:

```bash
cp local.env.example local.env
```

Install dependencies and start Nuxt:

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000` when started with `pnpm dev`.

When running Nuxt directly on the host, `DATABASE_URL` must point to a MongoDB host that the host
can resolve. If you use the Compose MongoDB service but run Nuxt with `pnpm dev`, change the host in
`DATABASE_URL` from `corpsum-mongodb` to `localhost`.

## Local Docker Deployment

The canonical local deployment uses `docker-compose.yaml`.

Before starting Compose, make sure the host directories configured in `local.env` exist:

```bash
set -a
. ./local.env
set +a
mkdir -p "$DOCKER_MONGODATA_DIR" "$DOCKER_MONGODUMPS_DIR"
```

Start the stack:

```bash
docker compose --env-file local.env up --build
```

Compose starts:

- `corpsum-mongodb`: MongoDB 7.0, exposed on host port `27017`.
- `corpsum-app`: the Dockerfile `dev` target, using `local.env`, exposed at
  `http://localhost:3001`.

For Compose, `DATABASE_URL` should use the service hostname `corpsum-mongodb`, as shown in
`local.env.example`. If you want generated metadata to point at the Compose app instead of the
direct Nuxt dev server, set `NUXT_PUBLIC_APP_BASE_URL` to `http://localhost:3001` in `local.env`.

Create a gzipped MongoDB archive dump from the running Compose MongoDB service:

```bash
pnpm db:dump
```

The dump is written inside the MongoDB container under `/data/dumps` and appears on the host in the
directory configured as `DOCKER_MONGODUMPS_DIR`. Use `pnpm db:dump -- --help` to see options for a
different env file, service name, output directory, or archive name.

## Production Deployment

Production deployment is handled by GitHub Actions in `.github/workflows/build-deploy.yml`.

- `main` deploys to the `production` environment.
- `development` deploys to the `development` environment.
- other branches deploy to `review/<branch-name>` environments.

The workflow builds the Docker image, pushes it to GitHub Container Registry, and deploys it through
`acdh-oeaw/gl-autodevops-minimal-port`. Public build-time settings come from GitHub environment
variables; server secrets come from GitHub environment secrets.

### Sync GitHub Environment Values

`dev.env` can be synced to the `acdh-oeaw/corpsum-ts` GitHub environment `review/dev` with:

```bash
pnpm github:env:sync
```

The script requires an authenticated GitHub CLI session with access to the repository:

```bash
gh auth status
```

Use `pnpm github:env:sync -- --dry-run` to print the GitHub variables and secrets that would be
updated without writing values. The script maps local dotenv names to the deployment workflow's
expected GitHub names, including the `K8S_SECRET_` prefix used by
`acdh-oeaw/gl-autodevops-minimal-port`, and ignores local-only `DOCKER_*` and `MONGO_ROOT_*`
settings.

## Environment Variables

`local.env` is the canonical local environment file. Package scripts load it through
`--dotenv local.env`.

| Variable                               | Required   | Scope        | Description                                                                                     |
| -------------------------------------- | ---------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                         | yes        | server/build | MongoDB connection string. Use `corpsum-mongodb` for Compose and `localhost` for host-run Nuxt. |
| `NUXT_AUTH_SECRET`                     | yes        | server/build | Secret used for auth/session JWT signing. Use at least 32 characters.                           |
| `NUXT_CREDENTIAL_SECRET`               | yes        | server/build | Secret used to encrypt stored NoSketch credentials. Use at least 32 characters.                 |
| `NUXT_JWT_EXPIRATION`                  | yes        | server/build | JWT lifetime in milliseconds.                                                                   |
| `NUXT_OAUTH_GITHUB_CLIENT_ID`          | no         | server       | GitHub OAuth app client id. GitHub sign-in is unavailable when unset.                           |
| `NUXT_OAUTH_GITHUB_CLIENT_SECRET`      | no         | server       | GitHub OAuth app client secret. Keep this value secret.                                         |
| `NUXT_PUBLIC_APP_BASE_URL`             | yes        | public/build | Canonical public app URL for i18n, metadata, robots, and sitemap output.                        |
| `NUXT_PUBLIC_REDMINE_ID`               | yes        | public/build | ACDH Redmine service id used by the imprint component and deployment metadata.                  |
| `NUXT_PUBLIC_BOTS`                     | no         | public/build | Set to `disabled` or `enabled` for robots handling.                                             |
| `NUXT_PUBLIC_MATOMO_BASE_URL`          | no         | public/build | Matomo base URL. Analytics loads only when this and `NUXT_PUBLIC_MATOMO_ID` are set.            |
| `NUXT_PUBLIC_MATOMO_ID`                | no         | public/build | Matomo site id.                                                                                 |
| `NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | no         | public/build | Google Search Console verification token.                                                       |
| `MONGO_ROOT_USER`                      | local only | Compose      | MongoDB root username for the local Compose service.                                            |
| `MONGO_ROOT_PASSWORD`                  | local only | Compose      | MongoDB root password for the local Compose service.                                            |
| `DOCKER_MONGODATA_DIR`                 | local only | Compose      | Host directory bind-mounted to MongoDB `/data/db`.                                              |
| `DOCKER_MONGODUMPS_DIR`                | local only | Compose      | Host directory bind-mounted to MongoDB `/data/dumps`.                                           |

For GitHub sign-in, create a GitHub OAuth app and set its callback URL to
`<NUXT_PUBLIC_APP_BASE_URL>/api/auth/sso/github/callback`, for example
`http://localhost:3000/api/auth/sso/github/callback` in local development.

## Commands

```bash
pnpm dev                 # run Nuxt locally with local.env
pnpm build               # build the production bundle with local.env
pnpm db:dump             # create a MongoDB archive dump through docker compose
pnpm github:env:sync     # sync dev.env to the review/dev GitHub environment
pnpm start               # preview the built app locally
pnpm generate            # generate a static build when applicable
pnpm generate:noske-api  # regenerate canonical types and the Bonito validation spec
pnpm format:check        # check formatting
pnpm lint:check          # run code and style linters
pnpm types:check         # run Nuxt type checking
pnpm validate:noske-paths # validate server-side NoSketch path translation rules
pnpm validate:noske-bonito # validate the generated Bonito spec against the CLARIN Bonito base
pnpm test:e2e            # run Playwright tests
pnpm validate            # run formatting, linting, type checking, and tests
```
