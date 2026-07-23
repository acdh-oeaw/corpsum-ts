# Plan 003: Constrain NoSketch Proxy Targets

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. When done, update the status row for this plan in
> `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 07d5dee..HEAD -- server/api/noskeinstances.post.ts server/api/noskeinstances/[id].patch.ts server/api/noske/[...engine].ts server/models/noskeinstances.schema.ts app/components/NoskeForm.vue local.env.example readme.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `advisor-plans/002-run-real-playwright-tests-in-ci.md` recommended
- **Category**: security
- **Planned at**: commit `07d5dee`, 2026-06-11

## Why This Matters

The server-side NoSketch proxy forwards requests using the stored
`noske.base`. Create and update routes currently accept that base URL as any
string from an authenticated user. That makes the app a server-side fetch proxy
to arbitrary network targets reachable from the deployment environment,
including internal, loopback, or link-local services if not constrained.

## Current State

- `server/api/noskeinstances.post.ts` creates NoSketch instance records.
- `server/api/noskeinstances/[id].patch.ts` updates existing instances.
- `server/api/noske/[...engine].ts` uses the stored base URL as `$fetch`
  `baseURL`.
- `server/models/noskeinstances.schema.ts` stores `base` and `host` as plain
  strings with no schema-level validation.

Current excerpts:

```ts
// server/api/noskeinstances.post.ts:51-78
const { name, base, host, public: isPublic } = payload;
if (typeof name !== "string" || typeof base !== "string" || typeof host !== "string") {
	setResponseStatus(event, 400, "required field missing");
	return;
}
...
const noskeinstance = await NoskeModel.create({
	name,
	base,
	version: payload.version,
	authentication: payload.authentication,
	public: isPublic,
	host,
	owner: user._id,
});
```

```ts
// server/api/noskeinstances/[id].patch.ts:86-91
if (Object.prototype.hasOwnProperty.call(payload, "base")) {
	if (typeof payload.base !== "string") {
		setResponseStatus(event, 400, "invalid base");
		return;
	}
	updates.base = payload.base;
}
```

```ts
// server/api/noske/[...engine].ts:87-92 and 116-121
const data = await fetcher(upstreamPath, {
	headers: proxyHeaders,
	baseURL: noske.base,
	method,
	params,
	body,
});
...
return await fetcher(upstreamPath, {
	headers: proxyHeaders,
	baseURL: noske.base,
	method,
	params,
	body,
});
```

Repo conventions to match:

- Shared server validation helpers should live in `server/utils/*.ts`.
- Routes prefer explicit payload checks and `setResponseStatus` or
  `createError`.
- NoSketch access policy helpers already live in `server/utils/noske.ts`.

## Commands You Will Need

| Purpose   | Command                                  | Expected on success     |
| --------- | ---------------------------------------- | ----------------------- |
| Typecheck | `pnpm types:check`                       | exit 0, no type errors  |
| Lint      | `pnpm lint:check`                        | exit 0                  |
| Format    | `pnpm format:check`                      | exit 0                  |
| Tests     | `pnpm test:e2e` and/or focused API tests | all relevant tests pass |

## Scope

**In scope**:

- `server/utils/noske.ts` or a new `server/utils/noske-url.ts`
- `server/api/noskeinstances.post.ts`
- `server/api/noskeinstances/[id].patch.ts`
- Tests for accepted and rejected NoSketch base URLs if a suitable test
  harness exists.
- Documentation updates only if the accepted URL policy is externally visible.

**Out of scope**:

- Changing `server/api/noske/[...engine].ts` proxy behavior beyond relying on a
  validated base URL.
- Adding a full admin approval workflow.
- Migrating existing database records.
- Changing the NoSketch path translation behavior.

## Git Workflow

- Branch: `advisor/003-constrain-noske-proxy-targets`
- Commit message: `fix: validate noske proxy targets`
- Do not push or open a PR unless the operator explicitly asks.

## Steps

### Step 1: Define the URL policy in one helper

Create a helper, preferably `server/utils/noske-url.ts`, that validates and
canonicalizes NoSketch base URLs.

Minimum policy:

- Accept only `http:` and `https:` initially if local/dev NoSketch instances
  require HTTP; otherwise use `https:` only if the project owner confirms.
- Reject empty values, relative URLs, username/password in URLs, and non-HTTP
  schemes.
- Reject loopback and obvious local hostnames: `localhost`, `127.0.0.0/8`,
  `::1`.
- Reject link-local/private IP literals: `10.0.0.0/8`, `172.16.0.0/12`,
  `192.168.0.0/16`, `169.254.0.0/16`, `fc00::/7`, `fe80::/10`.
- Return a normalized origin/base string suitable for `$fetch` `baseURL`,
  preserving a pathname only if NoSketch deployments need a base path.

Do not implement DNS resolution or network probing in this plan unless the
repo already has a dependency/pattern for it; IP-literal and hostname checks
are the first bounded improvement.

**Verify**: `pnpm types:check` -> exit 0.

### Step 2: Apply validation on create

In `server/api/noskeinstances.post.ts`, replace direct assignment of `base`
with the canonicalized helper result.

Keep the response shape unchanged:

- response still includes `base`
- `host` remains whatever the existing UI expects, unless you decide to derive
  it from the URL; deriving `host` is out of scope unless it is trivial and
  does not break current forms.

Invalid base URL should produce a 400 response with a generic message such as
`invalid base`.

**Verify**: `pnpm types:check` -> exit 0.

### Step 3: Apply validation on update

In `server/api/noskeinstances/[id].patch.ts`, apply the same helper whenever
`payload.base` is present. Store only the canonicalized value.

Do not alter ownership checks or other update fields.

**Verify**: `pnpm types:check` -> exit 0.

### Step 4: Add regression coverage

Add tests if the repo has an appropriate API/server test pattern. Cover:

- accepted normal NoSketch URL, including the scheme expected by local/dev docs
- rejected `http://localhost:...`
- rejected `http://127.0.0.1:...`
- rejected private IP literal, for example `http://10.0.0.1`
- rejected non-HTTP scheme

If no practical server test harness exists, document that gap and add no new
runner. Do not create an ad hoc test system in this plan.

**Verify**: focused test command if added; otherwise `pnpm types:check` -> exit 0.

### Step 5: Run checks

Run standard checks.

**Verify**:

- `pnpm format:check` -> exit 0.
- `pnpm lint:check` -> exit 0.
- `pnpm types:check` -> exit 0.

## Test Plan

- Prefer route/helper tests for `create` and `patch` validation.
- If tests can only cover the helper, ensure routes call the helper in both
  create and update paths.
- Do not test by making real network requests to internal addresses.

## Done Criteria

- [ ] No create/update path can persist an arbitrary unvalidated `base`.
- [ ] Invalid proxy targets receive a 400 response.
- [ ] Existing response shapes for valid instances are preserved.
- [ ] `pnpm format:check`, `pnpm lint:check`, and `pnpm types:check` exit 0.
- [ ] `advisor-plans/README.md` status row for plan 003 is updated.

## STOP Conditions

Stop and report if:

- Existing production data includes private/internal NoSketch bases that the
  proposed policy would reject and no rollout decision exists.
- The product owner requires arbitrary self-hosted targets with no allowlist or
  admin gate.
- Implementing safe DNS resolution becomes necessary to satisfy policy.
- Any verification command fails twice after a reasonable fix attempt.

## Maintenance Notes

This plan reduces risk but does not fully solve SSRF for hostnames that resolve
to private addresses after DNS lookup. A later hardening pass can add DNS
resolution or an explicit allowlist/admin approval workflow. Reviewers should
scrutinize URL canonicalization and make sure no route bypasses the helper.
