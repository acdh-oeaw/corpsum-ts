# Plan 012: Harden Source-Table Columns And Active-Tab Alignment

> **Executor instructions**: Keep this plan limited to the shared source table and focused tests.
> Follow query position and identity explicitly; do not work around missing entries by filtering
> arrays. Update the README status when done.
>
> **Drift check (run first)**:
> `git diff --stat 539026e..HEAD -- app/components/data-display/data-display-source-table.vue app/components/corpsum-data-table.vue playwright/index.ts e2e/tests/components`

## Status

- **Review reference**: `DDR-04`
- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug, component contract
- **Planned at**: commit `539026e`, 2026-07-23

## Why this matters

The source table derives one column schema from `data[0][0]` and applies it to every query tab. If
query zero is empty but query one has data, the valid table receives zero columns. The active tab is
also initialized only once, so removing the active query can leave no visible tab content.

## Required behavior

- Keep `queries[index]`, `data[index]`, and `loading[index]` aligned without filtering.
- Derive columns for the active query's data. If a visualization contract guarantees identical row
  shapes, falling back to the first non-empty aligned dataset is allowed, but it must not hide a
  later valid dataset.
- Pass `data[index] ?? []` safely; remove the non-null assertion at the render boundary.
- Whenever query IDs change, keep the current tab if it remains valid; otherwise select the first
  current query; use an empty tab value when there are no queries.
- A valid sibling table remains usable when another query is loading or empty.

## Scope

**In scope**:

- `app/components/data-display/data-display-source-table.vue`
- focused Playwright component coverage
- `playwright/index.ts` only for real Tabs/table component registration needed by the test
- `app/components/corpsum-data-table.vue` only if zero-column empty-state rendering requires a small
  safe adjustment

**Out of scope**:

- Changing visualization-specific row schemas.
- Export behavior, pagination design, or table styling.
- Replacing TanStack Table.
- Reordering the parent query/data arrays.

## Git workflow

- Suggested branch: `advisor/012-harden-data-display-source-table-alignment`
- Suggested commit: `fix: preserve source table query alignment`

## Steps

### Step 1: Make columns query-aware

Replace the query-zero-only `columns` computation with a query-aware form. Prefer a small pure helper
that converts one representative row into column definitions. Ensure switching tabs recomputes or
selects the columns for that query without mutating row data.

### Step 2: Normalize active tab against query IDs

Watch the current query ID list, not only an empty initial tab. Preserve a still-valid selection and
fall back deterministically when it disappears. Avoid watchers that emit transient invalid IDs.

### Step 3: Add focused regression coverage

Cover first-empty/later-valid data, different valid row shapes across two tabs, active-query removal,
query list becoming empty, query list repopulation, and a loading sibling. Assert the later valid
table receives columns and rows.

### Step 4: Run gates

Run the focused component spec, `pnpm types:check`, `pnpm format:check`, `pnpm lint:check`, and
`git diff --check`.

## Done criteria

- [ ] A later valid dataset renders when query zero is empty.
- [ ] Columns match the selected query's row shape.
- [ ] The active tab always refers to a current query or is empty.
- [ ] Missing positional data is handled as an empty dataset without a non-null assertion.
- [ ] Focused tests and repository checks pass.
- [ ] The README status row for Plan 012 is updated.

## STOP conditions

Stop if different row shapes require a product decision about a fixed exported schema; if Tabs cannot
be controlled without changing the shared UI primitive; or if the fix would require filtering and
therefore breaking positional alignment.

## Maintenance notes

The `datatype` prop is not part of this finding. Remove or repurpose it only in a separate cleanup
after confirming no external consumer depends on it.
