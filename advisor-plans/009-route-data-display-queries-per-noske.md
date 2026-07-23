# Plan 009: Route Each Data-Display Query Through Its Own NoSketch Instance

> **Executor instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving on. If a STOP condition occurs, stop and report; do not
> improvise. When done, update this plan's status row in `advisor-plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 539026e..HEAD -- app/components/data-display/data-display-media-source.vue app/components/data-display/data-display-media-type.vue app/components/data-display/data-display-regional-frequencies.vue app/composables/use-noske-freqml-queries.ts e2e/tests/components/categorical-and-regional-visualizations.spec.ts playwright/index.ts server/utils/published-visualizations.ts`
> The review was written against `539026e`. Re-read changed files before execution. A material
> contract or cache-identity mismatch is a STOP condition.

## Status

- **Review reference**: `DDR-01`
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug, data integrity, caching
- **Planned at**: commit `539026e`, 2026-07-23

## Why this matters

Media source, media type, and regional frequency components build one client from `queries[0].noske`
and reuse it for every query. A visualization can contain queries from several NoSketch instances.
The current code can send a later query's corpus to the wrong instance, show incorrect/empty data,
and warm a cache entry that publication will not find under the query's real instance.

## Required outcome

Every query descriptor carries its own `query.noske`. Live requests, client cache keys, server cache
identity, query details, and published lookup must all refer to the same query/instance pair. The
existing supplied-data rule remains unchanged: any defined `data` prop disables all live requests.

Use the temporal component and `useNoskeFreqMlQueries` as the proven model. Extend that composable's
typed params only where media source/type need `fmaxitems` and `fpage`; do not create three separate
first-query clients or a universal endpoint abstraction.

## Scope

**In scope**:

- `app/components/data-display/data-display-media-source.vue`
- `app/components/data-display/data-display-media-type.vue`
- `app/components/data-display/data-display-regional-frequencies.vue`
- `app/composables/use-noske-freqml-queries.ts`
- `e2e/tests/components/categorical-and-regional-visualizations.spec.ts`
- `playwright/index.ts` only if the component-test shim needs controllable query results

**Read-only identity reference**:

- `server/utils/published-visualizations.ts`
- `server/utils/noske-query-cache.ts`

**Out of scope**:

- Persisting chart settings (`DDR-02`, Plan 010).
- Adding localized live-error UI (`DDR-03`, Plan 011).
- Source-table schema/tab behavior (`DDR-04`, Plan 012).
- Migrating collocations, word forms, or KWIC (`DDR-06`, Plan 014).
- Restricting a visualization to one NoSketch instance.

## Git workflow

- Suggested branch: `advisor/009-route-data-display-queries-per-noske`
- Suggested commit: `fix: route visualization queries per noske instance`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Express complete per-query descriptors

For each migrated frequency component, build one `NoskeFreqMlQueryDescriptor` per current query:

- include `query.noske` in both the descriptor and Vue Query key;
- preserve corpus, subcorpus, faceting JSON, attribute, context, and endpoint-specific paging params;
- keep descriptors positional, including disabled entries;
- enable a live descriptor only when `data === undefined` and the descriptor has a usable NoSketch
  ID;
- do not derive any request identity from `queries[0]`.

Extend `NoskeFreqMlQueryDescriptor.params` for the already-used `fmaxitems`/`fpage` values rather than
dropping them during migration.

### Step 2: Execute and consume aligned query results

Run the descriptors through `useNoskeFreqMlQueries`. Derive each component's raw response, parsed
distribution, and loading entry from the result at the same query index. Supplied raw responses must
continue through the same parser and must never cause a request, including `[]`, sparse arrays, and
`null` entries.

Do not add user-facing error text in this plan. Retain query-result error state so Plan 011 can render
it without another query-mechanism rewrite.

### Step 3: Prove request and cache identity

Add focused component coverage with two queries whose `noske`, corpus, colors, and response values
are distinct. Assert descriptors/request URLs use A for query A and B for query B. Assert query keys
contain the matching NoSketch ID and do not alias.

Compare the live params with `createQueryParams` in `server/utils/published-visualizations.ts` for all
three types. If live and publication params differ, correct only the mismatch necessary for cache
identity and add a regression assertion.

### Step 4: Run gates

- `pnpm test:ct -- categorical-and-regional-visualizations.spec.ts`
- `pnpm types:check`
- `pnpm format:check`
- `pnpm lint:check`
- `git diff --check`

## Done criteria

- [ ] No reviewed component derives a live client or query key from `queries[0].noske`.
- [ ] Every live request uses the NoSketch ID belonging to its aligned query.
- [ ] Supplied data, including empty/null entries, disables all live requests.
- [ ] Live request params still reproduce publication cache identity.
- [ ] A mixed-instance regression test passes.
- [ ] Repository checks pass or documented baseline failures are unchanged.
- [ ] The README status row for Plan 009 is updated.

## STOP conditions

Stop and report if mixed-instance selection has become impossible by an explicit product invariant;
if a live request cannot reproduce publication cache identity without a schema change; if the
generated NoSketch type cannot express required frequency params; or if fixing routing requires a
publication schema/version migration.

## Maintenance notes

Reviewers should reject any future data-display code that constructs one NoSketch client for a
query array unless the component contract explicitly enforces a single-instance invariant.
