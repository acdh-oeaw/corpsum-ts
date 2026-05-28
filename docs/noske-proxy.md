# NoSke Proxy Endpoint

CorpSum sends NoSketch Engine requests through the Nuxt server endpoint:

```txt
/api/noske/:noskeInstanceId/:targetPath*
```

The endpoint is implemented in `server/api/noske/[...engine].ts`. It authenticates the
current CorpSum user, checks whether the user can read the requested NoSke instance, translates
the target path for the configured NoSke API version, and forwards the request to the instance
base URL.

## OpenAPI Contract

The proxy is intentionally a near-transparent NoSke API proxy. Client-side NoSke calls should
stick as closely as possible to the generated OpenAPI definitions and typings in:

- `public/noske.json`: canonical OpenAPI schema used for the generated TypeScript client types.
- `public/noske-bonito.json`: Bonito compatibility schema input.
- `lib/noske-types.d.ts`: generated TypeScript types consumed by `openapi-fetch`.

Regenerate the typings with:

```sh
pnpm generate:noske-api
```

The application should prefer the generated `paths` and response schemas from `lib/noske-types.d.ts`
over hand-written request or response shapes. The proxy should not wrap, rename, or otherwise
reshape NoSke response bodies. Consumers should be able to treat successful proxy responses as the
same typed NoSke responses they would receive from the upstream API.

The only intentional behavior added by CorpSum is:

- CorpSum user authorization and optional upstream basic-auth injection.
- MongoDB-backed caching for eligible search responses.
- CorpSum-specific cache metadata in HTTP headers.

Any change that alters a NoSke request or response body should be treated as an exception and
documented separately.

## Routing And Forwarding

The first path segment after `/api/noske/` is the CorpSum NoSke instance id. All remaining path
segments are treated as the NoSke target path.

Example:

```txt
GET /api/noske/64f...abc/search/concordance?corpname=...
```

For `openapi` NoSke instances, the target path is forwarded unchanged. For `bonito` instances,
CorpSum translates paths with `server/utils/noske-path.ts`; for example `/search/concordance`
is forwarded upstream as `/concordance`.

The proxy forwards:

- The request method.
- Query parameters.
- Request body for non-GET requests.
- `Content-Type`, when present.
- A generated upstream `Authorization` header when the NoSke instance uses stored basic auth
  credentials.

CorpSum-only headers, including cache-control and client query metadata headers, are not forwarded
to NoSke.

## Cache Eligibility

Only requests whose original client target path starts with `/search/` are cached. This is checked
before Bonito path translation, so both `openapi` and `bonito` NoSke instances are eligible for
the same CorpSum `/search/*` request paths.

Non-search requests are proxied normally and receive `X-Corpsum-Cache: skip`.

Only successful upstream responses returned by `$fetch` are persisted. If the upstream request
throws, the error propagates and no cache entry is written.

## Cache Key

Cached responses are scoped per CorpSum user, NoSke instance, and exact normalized NoSke request.
The cache key is a SHA-256 hash of:

- CorpSum user id.
- NoSke instance id.
- HTTP method.
- Translated upstream path.
- Normalized query parameters.
- Normalized request body.

Object keys are sorted and `undefined` values are omitted before hashing. This makes equivalent
parameter objects produce the same cache key independent of property order.

The persistent cache record is stored in the `noskequerycache` collection with a unique index on
`user`, `noske`, and `cacheKey`.

## Request Headers

### `X-Corpsum-Cache-Mode`

Controls whether the proxy may serve an existing cache entry.

Supported values:

```txt
X-Corpsum-Cache-Mode: refresh
```

When set to `refresh`, the proxy skips cache lookup, executes the upstream NoSke request, upserts
the cache entry, and returns the fresh response body. Any other value is treated as normal cache
mode.

This header is internal to CorpSum and must not be forwarded to NoSke.

### `X-Corpsum-Client-Query-Key`

Identifies the frontend TanStack Query key that initiated the request. The server does not use this
header for cache lookup. It exists so the `openapi-fetch` client middleware can associate returned
cache metadata headers with the correct frontend query row.

This header is internal to CorpSum and must not be forwarded to NoSke.

## Response Headers

The proxy returns CorpSum cache metadata as response headers. The response body remains the original
NoSke response data shape, whether the data came from NoSke or MongoDB.

### `X-Corpsum-Cache`

Cache status for this proxy response.

Values:

- `hit`: The response body was served from MongoDB.
- `miss`: No cache entry existed; the proxy fetched NoSke and stored the resolved response.
- `refresh`: The request explicitly bypassed cache lookup with `X-Corpsum-Cache-Mode: refresh`;
  the proxy fetched NoSke and upserted the cache entry.
- `skip`: The request was not cache-eligible, currently meaning the original target path did not
  start with `/search/`.

### `X-Corpsum-Cache-Key`

The SHA-256 cache key for cache-eligible requests. Present for `hit`, `miss`, and `refresh`.
Absent for `skip`.

This value is useful for debugging and correlating frontend metadata with server cache records. It
is not a stable public API for users to construct manually.

### `X-Corpsum-Cache-Noske`

The CorpSum NoSke instance id used for this proxy request. Present for all proxy responses where
the NoSke instance was resolved successfully.

### `X-Corpsum-Cache-Cached-At`

ISO timestamp for when the persisted cache record was last written. Present for `hit`, `miss`, and
`refresh`.

For `hit`, this is the timestamp of the existing cache entry. For `miss` and `refresh`, this is the
timestamp of the newly written or updated cache entry.

### `X-Corpsum-Cache-Fetched-At`

ISO timestamp for when the cached response data was fetched from upstream NoSke. Present for
`hit`, `miss`, and `refresh`.

For `hit`, this preserves the original upstream fetch timestamp. For `miss` and `refresh`, this is
the current upstream fetch timestamp.

### `X-Corpsum-Upstream-Duration-Ms`

The upstream NoSke request duration, rounded to milliseconds. Present for `hit`, `miss`, and
`refresh`.

For `hit`, this is the duration of the original upstream request that produced the cached response,
not the MongoDB lookup time. For `miss` and `refresh`, this is the duration of the current upstream
request.

## Frontend Refresh Flow

Frontend query rows use TanStack Query keys as the UI-side handle. Calling the row refresh action:

1. Marks that query key as refreshing in `useNoskeCacheMetadata`.
2. Invalidates the exact TanStack Query entry.
3. Adds `X-Corpsum-Cache-Mode: refresh` to the next NoSke request for that query key.
4. Lets the proxy fetch NoSke, upsert MongoDB, and return `X-Corpsum-Cache: refresh`.
5. Stores the returned metadata in an in-memory Nuxt state map keyed by
   `X-Corpsum-Client-Query-Key`.

The frontend metadata store is not persistent. MongoDB is the persistent cache source; frontend
state only reflects requests made during the current app session.
