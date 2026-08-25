# Plan 001: Fix JWT Expiration Units

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. When done, update the status row for this plan in
> `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 07d5dee..HEAD -- server/utils/jwt.ts server/api/auth/login.post.ts server/api/auth/refresh.get.ts server/api/auth/register.post.ts readme.md package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security, bug
- **Planned at**: commit `07d5dee`, 2026-06-11

## Why This Matters

`NUXT_JWT_EXPIRATION` is documented as a millisecond duration, but
`server/utils/jwt.ts` passes a millisecond epoch number directly to
`SignJWT.setExpirationTime`. Numeric JWT `exp` values are NumericDate seconds,
so a one-hour millisecond config can produce a token that remains valid far
longer than intended. The fix should make token expiration match the documented
runtime config and keep login/register/refresh response `expires` values
consistent.

## Current State

- `server/utils/jwt.ts` creates and verifies JWTs.
- `server/api/auth/login.post.ts`, `server/api/auth/register.post.ts`, and
  `server/api/auth/refresh.get.ts` return an `expires` timestamp to the client.
- `readme.md` documents `NUXT_JWT_EXPIRATION` as milliseconds.

Current excerpts:

```ts
// server/utils/jwt.ts:9-15
export async function createJWT(username: string) {
	return await new SignJWT({ username })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuer("acdh-ch.corpsum")
		.setIssuedAt()
		.setExpirationTime(Date.now() + parseInt(jwtExpiration))
		.sign(JWT_SECRET);
}
```

```md
<!-- readme.md:137-139 -->

| `NUXT_AUTH_SECRET` | yes | server/build | Secret used for auth/session JWT signing. Use at least 32 characters. |
| `NUXT_CREDENTIAL_SECRET` | yes | server/build | Secret used to encrypt stored NoSketch credentials. Use at least 32 characters. |
| `NUXT_JWT_EXPIRATION` | yes | server/build | JWT lifetime in milliseconds. |
```

Repo conventions to match:

- Server helpers live in `server/utils/*.ts`.
- Auth route handlers use `createError` or `setResponseStatus` for client
  failures and keep response payloads simple.
- Formatting is enforced by `pnpm format:check`; use existing tab indentation.

## Commands You Will Need

| Purpose            | Command             | Expected on success                                   |
| ------------------ | ------------------- | ----------------------------------------------------- |
| Typecheck          | `pnpm types:check`  | exit 0, no type errors                                |
| Lint               | `pnpm lint:check`   | exit 0                                                |
| Format             | `pnpm format:check` | exit 0                                                |
| Focused validation | `pnpm validate`     | exit 0 after the repository test surface is available |

## Scope

**In scope**:

- `server/utils/jwt.ts`
- `server/api/auth/login.post.ts`
- `server/api/auth/refresh.get.ts`
- `server/api/auth/register.post.ts`
- A focused test file if the executor adds one under `e2e/tests` or a
  repository-supported server test location.

**Out of scope**:

- Changing auth cookie/session mechanics in `server/utils/session.ts`.
- Changing the configured unit in `readme.md`; the documented unit remains
  milliseconds.
- Rotating secrets or invalidating stored sessions outside normal expiration.

## Git Workflow

- Branch: `advisor/001-fix-jwt-expiration-units`
- Commit message: `fix: use configured jwt expiration duration`
- Do not push or open a PR unless the operator explicitly asks.

## Steps

### Step 1: Centralize expiration parsing

In `server/utils/jwt.ts`, add a small helper that parses `jwtExpiration` as a
positive integer millisecond duration. It should reject missing, non-numeric,
zero, and negative values with a 500 `createError` because that is server
misconfiguration.

Target behavior:

- `3600000` means one hour.
- `Date.now() + durationMs` remains the client-facing `expires` timestamp.
- The JWT `exp` must be set using a `Date` object or second-based NumericDate,
  not the raw millisecond epoch number.

One safe shape:

```ts
export function getJwtExpirationMs() {
	const expirationMs = Number.parseInt(jwtExpiration ?? "", 10);
	if (!Number.isFinite(expirationMs) || expirationMs <= 0) {
		throw createError({ statusCode: 500, statusMessage: "JWT expiration is not configured" });
	}
	return expirationMs;
}
```

Then in `createJWT`, use:

```ts
const expiresAt = new Date(Date.now() + getJwtExpirationMs());
...
.setExpirationTime(expiresAt)
```

**Verify**: `pnpm types:check` -> exit 0.

### Step 2: Reuse the helper in auth responses

Update `server/api/auth/login.post.ts`, `server/api/auth/register.post.ts`, and
`server/api/auth/refresh.get.ts` to import the helper from `server/utils/jwt`
and calculate `expires` as `Date.now() + getJwtExpirationMs()`.

Remove route-local `useRuntimeConfig()` reads for `jwtExpiration` when they are
only used to compute `expires`.

**Verify**: `pnpm types:check` -> exit 0.

### Step 3: Add a regression check if feasible

If the repo has an obvious server-test pattern available after inspection, add
a focused test that verifies a one-hour config yields a JWT with `exp` roughly
one hour from issuance. If there is no practical test harness for server utils,
add no ad hoc test runner; instead document the gap in the final execution
notes and rely on typecheck/lint plus manual inspection.

Acceptable test assertion:

- Create a token with `NUXT_JWT_EXPIRATION=3600000`.
- Verify/decode it.
- Assert `exp - iat` is approximately `3600` seconds, allowing a small clock
  tolerance.

**Verify**: run the focused test command if a test was added; otherwise run
`pnpm types:check` -> exit 0.

### Step 4: Run repo checks

Run the standard checks that are cheap and relevant for this localized change.

**Verify**:

- `pnpm format:check` -> exit 0.
- `pnpm lint:check` -> exit 0.
- `pnpm types:check` -> exit 0.

## Test Plan

- Prefer a focused JWT helper test if there is a suitable existing server test
  harness.
- At minimum, confirm `createJWT` receives a `Date` or seconds-style value for
  expiration, not `Date.now() + ms` as a number.
- Existing auth route behavior should remain unchanged except for token
  lifetime correctness.

## Done Criteria

- [ ] `server/utils/jwt.ts` parses `NUXT_JWT_EXPIRATION` as a positive
      millisecond duration.
- [ ] `createJWT` passes a `Date` or seconds NumericDate to
      `setExpirationTime`.
- [ ] Login/register/refresh `expires` responses still return a millisecond
      epoch timestamp.
- [ ] `pnpm format:check`, `pnpm lint:check`, and `pnpm types:check` exit 0.
- [ ] `advisor-plans/README.md` status row for plan 001 is updated.

## STOP Conditions

Stop and report if:

- `server/utils/jwt.ts` no longer contains `createJWT` or uses a different JWT
  library.
- The repository has introduced a new auth/session abstraction that supersedes
  these routes.
- Fixing this requires changing cookie/session storage semantics.
- Any verification command fails twice after a reasonable fix attempt.

## Maintenance Notes

Reviewers should check that all JWT lifetime calculations use one shared helper
and that no route keeps parsing `jwtExpiration` independently. Future changes
to auth config should preserve the distinction between millisecond duration
configuration and JWT NumericDate seconds.
