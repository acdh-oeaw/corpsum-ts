# Plan 011: Render Localized Per-Query Data-Display Errors

> **Executor instructions**: Execute after Plan 009 so live query results are aligned and available.
> Add user-facing text through the i18n module only. Run English and German component coverage and
> stop on ambiguous error/empty-state semantics. Update the README status when done.
>
> **Drift check (run first)**:
> `git diff --stat 539026e..HEAD -- app/components/data-display/data-display-media-source.vue app/components/data-display/data-display-media-type.vue app/components/data-display/data-display-regional-frequencies.vue i18n/messages/en.json i18n/messages/de.json e2e/tests/components/categorical-and-regional-visualizations.spec.ts playwright/index.ts`

## Status

- **Review reference**: `DDR-03`
- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: Plan 009
- **Category**: bug, UX, i18n, accessibility
- **Planned at**: commit `539026e`, 2026-07-23

## Why this matters

The migrated non-temporal components currently clear loading after a failed request but render no
error. A first failure looks like an empty result, while a refetch failure can leave stale data
visible without explaining that refresh failed. One failed query must not hide successful siblings.

## Required behavior

- Track loading and errors positionally for every query.
- Render a localized, accessible message next to the affected query.
- Distinguish live request failure from successful empty data and supplied missing/null snapshots.
- If stale data remains visible after a refetch failure, explicitly say the displayed result may be
  stale; otherwise clear it and show a load failure. Choose one consistent behavior based on the
  Vue Query state available after Plan 009.
- Keep valid sibling queries and their charts usable.

Add parallel English/German keys under visualization-specific namespaces or a well-structured shared
data-display error namespace. Prefer full-sentence keys that translate naturally. The messages must
identify the operation semantically, for example that media-source, media-type, or regional
frequency data for this query could not be loaded. Do not expose raw upstream bodies, URLs,
credentials, stack traces, or cache keys.

## Scope

**In scope**:

- the three migrated non-temporal components
- `i18n/messages/en.json`
- `i18n/messages/de.json`
- categorical/regional component tests
- shared alert UI only if an existing primitive is reused without redesign

**Out of scope**:

- Toast infrastructure or global error handling.
- Automatic retry policy changes.
- Logging/observability or raw server error display.
- Treating supplied `null` as a live request error.
- Error handling for Plan 014's legacy components.

## Git workflow

- Suggested branch: `advisor/011-localize-data-display-live-errors`
- Suggested commit: `fix: show localized visualization query errors`

## Steps

### Step 1: Define the state model and i18n inventory

Derive `isLoading`, `isFetching`, `isError`, and retained-data state per aligned query from Plan 009's
query results. Add English and German keys for initial-load failure and, if retained stale data is
shown, refresh failure. Use existing translated visualization names where natural; avoid sentence
fragments whose grammar depends on interpolation order.

### Step 2: Render accessible per-query notices

Render errors in or directly beside the affected query block with `role="alert"` (or appropriate
live-region semantics). Keep query details available. Do not collapse multiple query errors into one
unlabelled global message, and do not suppress successful siblings.

### Step 3: Cover failure boundaries

Add component cases for one success plus one failure, all failures, initial failure, refetch failure
with any retained data policy, successful empty response, and supplied `null`. Render the suite in
English and German and assert no missing-key warnings.

### Step 4: Run gates

- `pnpm test:ct -- categorical-and-regional-visualizations.spec.ts`
- `pnpm types:check`
- `pnpm format:check`
- `pnpm lint:check`
- `git diff --check`

## Done criteria

- [ ] Live errors cannot appear as indistinguishable empty success.
- [ ] Each affected query has a localized accessible message.
- [ ] Partial success remains visible and correctly labelled.
- [ ] Empty and supplied-missing states are not misreported as network errors.
- [ ] English and German tests pass with no missing keys.
- [ ] The README status row for Plan 011 is updated.

## STOP conditions

Stop if Plan 009 did not expose aligned query error state; if product ownership cannot decide whether
stale data remains visible after refresh failure; or if upstream errors contain information that
cannot safely be mapped to a generic user-facing category.

## Maintenance notes

Future components should reuse the state semantics and accessibility pattern, not necessarily the
exact message key. Domain-specific failures remain translatable at their presentation boundary.
