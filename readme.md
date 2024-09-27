# app template

template repository for nuxt 3 apps.

## how to run

prerequisites:

- [Node.js v18](https://nodejs.org/en/download)
- [pnpm](https://pnpm.io/installation)

set required environment variables in `.env.local`:

```bash
cp .env.example ..env.local
```

also, set environment variables required by github actions. use
["variables"](https://github.com/acdh-oeaw/template-app-nuxt/settings/variables/actions) for every
environment variable prefixed with `NUXT_PUBLIC_`, and
["secrets"](https://github.com/acdh-oeaw/template-app-nuxt/settings/secrets/actions) for all others.

install dependencies:

```bash
pnpm install
```

run a development server on [http://localhost:3000](http://localhost:3000):

```bash
pnpm run dev
```

To set up a database with docker-compose:

```bash
# run the mongodb container specified in the compose file
docker-compose --env-file ./.env.local run corpsum-mongodb
# enter the mongodb container and set up your database and user
docker exec -it <containerID> sh
mongosh --username <NUXT_MONGO_ROOT_USER> --password <NUXT_MONGO_ROOT_PASSWORD>
use <NUXT_DATABASE_NAME>
db.createUser({user: "<NUXT_DATABASE_USER>", pwd: "<NUXT_DATABASE_PASSWORD>",  roles: ["readWrite"]})
```

then shutdown the db with <kbd>Ctrl</kbd>+<kbd>C</kbd> and run the app like so

```bash
docker-compose --env-file ./.env.local up
```
