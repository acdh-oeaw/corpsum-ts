# Plan 014: Unify Non-Metadata Data-Display Contracts Without Unifying Their Queries

> **Executor instructions**: Migrate word-form frequencies, collocations, and keyword-in-context as
> three endpoint-specific vertical slices. They are not metadata-driven: do not add metadata
> mappings or force their requests through the temporal/frequency abstraction. Reuse the public
> live/snapshot/presentation protocol while preserving each query's own parameters and response
> type. Update the README status when done.
>
> **Drift check (run first)**:
> `git diff --stat 539026e..HEAD -- app/components/data-display/data-display-word-form-frequencies.vue app/components/data-display/data-display-collocations.vue app/components/data-display/data-display-keyword-in-context.vue app/components/kwic-query-display.vue app/components/published/published-visualization-renderer.vue app/lib/visualization-types.ts server/utils/published-visualizations.ts e2e/tests/components docs/visualization-components.md`

## Status

- **Review reference**: `DDR-06`
- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: Plans 009, 010, 011, and 012; Plan 013 recommended
- **Category**: refactor, architecture, publication, tests
- **Planned at**: commit `539026e`, 2026-07-23

## Why this matters

These three components still accept only live `queries`. Published rendering duplicates their raw
response interfaces, transformations, and markup. This creates two public contracts and lets live
and published behavior drift.

They should share the proven component boundary, but not the same query implementation:

- word-form frequencies call `/search/freqml` with word grouping;
- collocations call `/search/collx` with collocation attribute/statistic parameters;
- KWIC calls `/search/concordance` with query-owned attributes, structures, refs, and view options;
- none requires a corpus metadata mapping.

The goal is protocol consistency, not pretending these analyses are metadata-driven.

## Required public boundary

Each top-level component should accept:

- required query-aligned `queries`;
- optional query-aligned raw `data` using its generated NoSketch response type;
- `interactive`, `showHeader`, and `showSourceData` where applicable;
- type-specific persisted settings for controls whose values must survive save/publish/embed;
- a complete `update:settings` event when it has persisted settings.

`data === undefined` means live mode. Any defined array—including empty, sparse, or nullish
entries—means supplied mode and must disable every live request. Both modes use one transformation
and rendering path. Components must not receive `metadataMappings` unless a future product change
actually introduces a metadata semantic.

## Scope

**In scope**:

- the three top-level data-display components and `kwic-query-display.vue` as needed
- endpoint-specific client descriptors/helpers
- type-specific settings codecs through Plan 010's extension point
- published snapshot assembly and renderer wiring
- generated response types from `lib/noske-types.d.ts`
- i18n/accessibility and focused CT/publication tests
- `docs/visualization-components.md` clarification for non-metadata-driven query families

**Out of scope**:

- Adding metadata semantics/mappings to these analyses.
- A universal NoSketch query descriptor spanning freqml, collx, and concordance.
- Changing collocation statistics, word grouping, KWIC result meaning, or default page sizes without
  a separate product decision.
- Redesigning the KWIC detail dialog or table.
- Publication schema/version changes unless separately approved.

## Git workflow

- Suggested branch: `advisor/014-unify-non-metadata-data-display-contracts`
- Use one reviewable commit per migrated analysis, followed by renderer cleanup, for example:
  `refactor: make word frequencies snapshot-capable`,
  `refactor: make collocations snapshot-capable`, and
  `refactor: make kwic snapshot-capable`.
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Specify endpoint-specific contracts before editing

For each analysis, record the exact generated response type, request path, response-changing params,
Vue Query/cache identity, settings fields, empty/missing/error behavior, and publication request.
Compare live parameters with `server/utils/published-visualizations.ts`.

Classify controls:

- word-form frequency mode is persisted presentation state;
- collocation frequency/weight mode and `cattr` require explicit settings; `cattr` changes the
  upstream response and publication cache identity;
- KWIC query attributes/structures belong to each query snapshot, not a visualization metadata
  mapping; whether the view-options panel is open is transient unless product requirements say
  otherwise.

Stop if current live and published request semantics disagree with no authoritative test.

### Step 2: Migrate word-form frequencies

Add raw supplied-data support, per-query NoSketch routing, aligned result/loading/error derivation,
presentation flags, localized errors, persisted mode/source-table state, and complete settings
emission. Pass captured raw frequency responses and normalized settings from the published renderer
to this same component. Remove its duplicated published transformation/markup.

### Step 3: Migrate collocations

Use the generated collx response type. Preserve `cattr`, window, thresholds, statistic names, sort,
and item count in live and server publication identity. Supplied raw responses use the same
transformation and word-cloud/table rendering path. Persist response-changing `cattr` and selected
display mode so publication captures the same request and presentation.

Do not reuse `useNoskeFreqMlQueries`; add a narrow collocation query mechanism or a safe per-query
client helper only if it has a clear endpoint-specific contract.

### Step 4: Migrate KWIC

Move the live/supplied boundary to the top-level data-display component or make
`kwic-query-display.vue` explicitly accept one raw response and a live-mode switch. Preserve each
query's `KWICAttrsStructs`, fixed structures, refs, faceting, page size, and format in live and
published identity. Render captured concordance responses through the same KWIC table/detail path
and remove the renderer's handwritten English table.

Do not treat query-owned structures as visualization metadata mappings or global settings.

### Step 5: Remove published duplication and update the contract

Delete local duplicate FreqML/Collx/Concordance interfaces and parsing functions from the published
renderer after their last consumer moves. Reconstruct query-aligned raw arrays with nullish holes and
pass presentation flags consistently for page and embed contexts.

Update the visualization contract to state that metadata-driven and non-metadata-driven analyses
share the component boundary but own different descriptor builders, params, validation, and settings.

### Step 6: Add the full behavior matrix and run gates

For every migrated component cover one/multiple queries, mixed NoSketch instances, supplied success,
`[]`, `null`, missing index, no-network proof, live success/error, partial failure, settings emission,
published/embed reconstruction, English/German, accessible controls, and 320-pixel layout where
controls exist. Add cache-identity coverage for collocation `cattr` and KWIC structures.

Run focused CT tests after each slice, then `pnpm test:ct`, applicable publication/E2E tests,
`pnpm types:check`, `pnpm format:check`, `pnpm lint:check`, and `git diff --check`.

## Done criteria

- [ ] All three components implement the common live/snapshot/presentation boundary.
- [ ] None imports or requires metadata mapping state.
- [ ] Each endpoint keeps its own complete query/cache identity.
- [ ] Persisted controls survive create/edit/detail/publish/embed.
- [ ] Published rendering reuses the components and generated response types.
- [ ] Duplicated published transformations and hard-coded KWIC table labels are removed.
- [ ] Partial/missing/error states remain query-aligned and localized.
- [ ] Tests and repository gates pass.
- [ ] The README status row for Plan 014 is updated.

## STOP conditions

Stop if a component needs a new metadata semantic after all; if live/published request meaning cannot
be reconciled without product input; if response-changing settings cannot be reproduced at
publication time; if generated response types are insufficient; or if positional snapshot alignment
requires a schema/version change.

## Maintenance notes

Shared protocol does not imply shared mechanism. Future analyses may reuse the component boundary
while retaining endpoint-specific descriptors, parsers, settings codecs, and domain transformations.
