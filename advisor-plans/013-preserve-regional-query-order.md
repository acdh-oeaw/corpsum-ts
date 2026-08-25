# Plan 013: Preserve Regional Result Identity Across Query Changes

> **Executor instructions**: Execute after Plan 009. Treat query/result identity as the invariant,
> not incidental array history. If Plan 009 already removed the faulty watcher, retain this plan as
> the required regression-hardening pass and verify no equivalent history-based state remains.
> Update the README status when done.
>
> **Drift check (run first)**:
> `git diff --stat 539026e..HEAD -- app/components/data-display/data-display-regional-frequencies.vue app/components/combined-map-chart.vue app/components/map-chart.vue e2e/tests/components/categorical-and-regional-visualizations.spec.ts`

## Status

- **Review reference**: `DDR-05`
- **Priority**: P2
- **Effort**: S
- **Risk**: MED
- **Depends on**: Plan 009
- **Category**: bug, data integrity, tests
- **Planned at**: commit `539026e`, 2026-07-23

## Why this matters

Regional live results are written by an old array index and later filtered/deduplicated by query ID.
Filtering does not reorder retained entries. After reorder/removal or out-of-order request completion,
regional values can be rendered with another query's label and color.

## Required behavior

- `queries[index]`, the descriptor/result at `index`, parsed `RegionalFrequency`, loading, error,
  map, bar series, and source table must always describe the same query.
- Supplied data remains positional and is remapped whenever queries/data change.
- Live results derive from the current descriptor/result order after Plan 009.
- No filter/deduplicate watcher may use historical result-array order as the source of truth.
- Repeated corpus/query text is valid; identity must not depend on corpus name or user input.

## Scope

**In scope**:

- `app/components/data-display/data-display-regional-frequencies.vue`
- focused regional component tests
- map child components only if an explicit prop type/invariant correction is required

**Out of scope**:

- Map visual design, region mapping, scales, or chart settings.
- Generalizing a keyed result store for every visualization.
- Source-table internal column/tab behavior covered by Plan 012.

## Git workflow

- Suggested branch: `advisor/013-preserve-regional-query-order`
- Suggested commit: `fix: preserve regional query result alignment`

## Steps

### Step 1: Remove history-based regional result mutation

Delete the watcher that filters/deduplicates `regionalFrequencies`. Derive the current parsed array
directly from supplied data or Plan 009's aligned live query results. If an intermediate keyed map is
unavoidable, map it back through the current query IDs before any child receives it.

### Step 2: Audit every regional consumer

Trace separate maps, combined map, bar series, loading/error UI, query details, and source table.
Confirm each reads the same current index or explicit query ID. Strengthen types so a missing entry is
handled intentionally rather than shifted.

### Step 3: Add timing and reorder regression tests

Use two queries with unmistakably distinct IDs, labels, colors, and region values. Cover reorder,
removing the first query, adding it back, repeated corpus names, supplied-data replacement, and live
requests resolving in reverse order. Assert values remain attached to the correct label/color.

### Step 4: Run gates

Run the categorical/regional component spec, `pnpm types:check`, `pnpm format:check`,
`pnpm lint:check`, and `git diff --check`.

## Done criteria

- [ ] Regional rendering has no history-based filter/deduplicate result watcher.
- [ ] Every map/chart/table consumer preserves current query identity.
- [ ] Reorder, removal, repeated-corpus, and reverse-completion tests pass.
- [ ] Repository checks pass.
- [ ] The README status row for Plan 013 is updated.

## STOP conditions

Stop if query IDs are not stable/unique within one visualization; if a child component requires
positional data that cannot represent missing entries; or if Plan 009 changed the result contract in
a way not documented by its tests.

## Maintenance notes

Prefer derivation over mirrored mutable arrays. When positional APIs are required, preserve holes;
never repair alignment by filtering.
