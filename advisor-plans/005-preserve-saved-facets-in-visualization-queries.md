# Plan 005: Preserve Saved Facets In Visualization Queries

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. When done, update the status row for this plan in
> `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 07d5dee..HEAD -- app/composables/use-corpus-query-builder.ts app/utils/corpus-query.ts app/types/query.d.ts server/api/queries.get.ts app/pages/visualization/[...id].vue app/pages/visualization/edit/[...id].vue`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `advisor-plans/002-run-real-playwright-tests-in-ci.md` recommended
- **Category**: bug
- **Planned at**: commit `07d5dee`, 2026-06-11

## Why This Matters

Saved queries include `facettingValues`, and query detail/edit pages preserve
them. But visualizations rebuild saved queries into runtime `CorpusQuery`
objects with `facettingValues: {}`. All visualization panels call
`getQueryWithFacetting(query)`, so saved/copy queries with facets render broader
unfiltered results in visualizations.

## Current State

- `server/api/queries.get.ts` includes `facettingValues` in list responses.
- `app/composables/use-corpus-query-builder.ts` converts `QueryListItem` into
  `CorpusQuery`.
- `app/utils/corpus-query.ts` sends facets only from `CorpusQuery.facettingValues`.
- `app/types/query.d.ts` defines the expected `FacettingValues` shape.

Current excerpts:

```ts
// server/api/queries.get.ts:76-82
return {
	_id: query._id.toString(),
	name: String(query.name),
	owner: ownerList,
	noske: query.noske.toString(),
	corpus: String(query.corpus),
	subCorpus: String(query.subCorpus),
	type,
	userInput: String(query.userInput),
	facettingValues: query.facettingValues,
	updatedAt: query.updatedAt ? query.updatedAt.toISOString() : "",
};
```

```ts
// app/composables/use-corpus-query-builder.ts:14-36
return {
	id: index,
	noske: item.noske,
	type: item.type,
	userInput: item.userInput,
	finalQuery,
	preparedQuery: `aword,${finalQuery}`,
	color: colors[index % colors.length] ?? "#111827",
	showPicker: false,
	corpus: item.corpus,
	subCorpus: item.subCorpus,
	concordance_query,
	...
	facettingValues: {},
	SampleRatio: 100,
```

```ts
// app/utils/corpus-query.ts:25-35
export function getQueryWithFacetting(query: CorpusQuery) {
	const result: Record<string, string | Array<string>> = { ...query.concordance_query };
	for (const key in query.facettingValues) {
		const elem = query.facettingValues[key];
		if (!elem) continue;
		if (Array.isArray(elem)) {
			if (!elem.length) continue;
			result[`sca_${key}`] = elem;
		} else result[elem.key] = elem.value;
	}
	return result;
}
```

Relevant type:

```ts
// app/types/query.d.ts
interface FacettingRegexSearch {
	key: string;
	value: string;
}

type FacettingValues = Record<string, Array<string> | FacettingRegexSearch>;
```

Repo conventions to match:

- Client-side reusable transforms live in `app/utils` or `app/composables`.
- Existing code uses narrow runtime guards for unknown server payloads instead
  of broad casts when safety matters.
- Query form code already parses JSON facet values before save; this plan must
  handle stored unknown values defensively.

## Commands You Will Need

| Purpose             | Command                                | Expected on success    |
| ------------------- | -------------------------------------- | ---------------------- |
| Typecheck           | `pnpm types:check`                     | exit 0, no type errors |
| Lint                | `pnpm lint:check`                      | exit 0                 |
| Format              | `pnpm format:check`                    | exit 0                 |
| Component/E2E tests | `pnpm test:ct` or focused test command | relevant tests pass    |

## Scope

**In scope**:

- `app/composables/use-corpus-query-builder.ts`
- `app/utils/corpus-query.ts` only if a shared facet normalizer belongs there
- A focused test for facet normalization if a suitable test pattern exists

**Out of scope**:

- Fixing mixed NoSketch instance routing in visualization panels.
- Fixing publish cache key mismatches.
- Changing the persisted query schema.
- Changing query form UX.

## Git Workflow

- Branch: `advisor/005-preserve-saved-facets-in-visualization-queries`
- Commit message: `fix: preserve facets in visualization queries`
- Do not push or open a PR unless the operator explicitly asks.

## Steps

### Step 1: Add a defensive facet normalizer

Add a small function that converts `unknown` into `FacettingValues`.

Accepted shapes:

- object whose values are arrays of strings
- object whose values are `{ key: string, value: string }`

Rejected/ignored shapes:

- non-object values
- arrays at the top level
- facet arrays containing non-strings
- regex entries missing string `key` or string `value`

The function can live in `app/composables/use-corpus-query-builder.ts` if only
used there, or in `app/utils/corpus-query.ts` if it is likely to be reused.

Target behavior:

```ts
normalizeFacettingValues({
	region: ["east", "west"],
	date: { key: "fsca_doc.datum", value: "(?i).*2020.*" },
});
```

returns the same two valid entries, typed as `FacettingValues`.

**Verify**: `pnpm types:check` -> exit 0.

### Step 2: Use the normalizer in `buildCorpusQuery`

In `app/composables/use-corpus-query-builder.ts`, replace:

```ts
facettingValues: {},
```

with:

```ts
facettingValues: normalizeFacettingValues(item.facettingValues),
```

Do not change any other defaults in `buildCorpusQuery`.

**Verify**: `pnpm types:check` -> exit 0.

### Step 3: Add focused coverage if feasible

If there is a lightweight test pattern available for composables/utils, add a
focused test covering:

- array facet values are preserved
- regex facet values are preserved
- invalid stored values are ignored
- `getQueryWithFacetting(buildCorpusQuery(item, 0))` includes `sca_<key>` for
  array facets and raw `entry.key` for regex facets

If no unit-test runner exists, do not add one. Consider adding a small
Playwright component or page-level regression only if it is already
straightforward. Otherwise document the coverage gap.

**Verify**: focused test command if added; otherwise `pnpm types:check` -> exit 0.

### Step 4: Run checks

**Verify**:

- `pnpm format:check` -> exit 0.
- `pnpm lint:check` -> exit 0.
- `pnpm types:check` -> exit 0.

## Test Plan

- Best test: pure function test for `normalizeFacettingValues` and
  `getQueryWithFacetting`.
- Acceptable fallback: manually inspect the generated query key/body in a
  visualization with a faceted saved query, and document that no unit runner is
  configured.
- Do not broaden this into testing all visualization panels.

## Done Criteria

- [ ] `buildCorpusQuery` uses stored `QueryListItem.facettingValues`.
- [ ] Invalid stored facet payloads cannot crash visualization rendering.
- [ ] `getQueryWithFacetting` receives non-empty facets for valid saved query
      facets.
- [ ] `pnpm format:check`, `pnpm lint:check`, and `pnpm types:check` exit 0.
- [ ] `advisor-plans/README.md` status row for plan 005 is updated.

## STOP Conditions

Stop and report if:

- `QueryListItem.facettingValues` is removed or replaced by a different stored
  query structure.
- Preserving facets requires changing server response shape.
- The fix appears to require touching visualization panel request routing.
- Any verification command fails twice after a reasonable fix attempt.

## Maintenance Notes

This plan intentionally fixes only the dropped facets. Mixed-instance request
routing and live-vs-publish cache identity mismatches are separate findings and
should be handled in separate branches. Reviewers should check that the
normalizer is defensive because stored Mongo payloads are typed as `unknown`.
