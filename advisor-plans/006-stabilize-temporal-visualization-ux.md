# Plan 006: Stabilize the temporal frequency visualization UX

> **Executor instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving to the next step. If anything in the "STOP conditions"
> section occurs, stop and report; do not improvise. When done, update this plan's status row in
> `advisor-plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 7eb7ded..HEAD -- app/components/data-display/data-display-temporal-frequency-distribution.vue app/lib/visualization-types.ts i18n/messages/en.json i18n/messages/de.json e2e/tests/components/temporal-frequency-distribution.spec.ts`
> If any in-scope file changed, compare the current state below with live code. Material mismatch is
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `7eb7ded`, 2026-07-12

## Why this matters

The temporal visualization is functionally complete but its controls do not yet communicate a clear
hierarchy, several widths are desktop-oriented, and user-facing English remains embedded in the Vue
template and error state. This PR makes the pilot visualization responsive, accessible, and fully
localized before its conventions are documented and copied to other visualization components. It
must preserve data fetching, aggregation, persistence, and published-snapshot behavior.

## Current state

- `app/components/data-display/data-display-temporal-frequency-distribution.vue` owns the public
  props, local control state, NoSketch queries, parsing, both charts, and the source table.
- Its controls currently appear as one flat wrapping row. The mode toggle occupies a full row, while
  the time unit and interval triggers use `min-w-60`; see lines 367-396 and 436-458.
- The first control group configures the underlying time series: frequency mode, time unit, start,
  and exclusive end. The second configures the derived interval chart: interval size and direction.
  Preserve this semantic separation and make it visually explicit.
- User-facing literals currently include the card title, mapping notices, date/unit labels,
  validation and load errors, parse warning, interval heading/options, and reverse label. Existing
  translated strings such as `absolute`, `relative`, `interval`, `ShowData`, and `HideData` should be
  reused rather than duplicated.
- `i18n/messages/en.json` and `i18n/messages/de.json` keep parallel JSON message structures. Add a
  nested `TemporalFrequencyDistribution` namespace to both files for new component-specific text.
  Use Vue I18n named interpolation and pluralization instead of assembling translated sentences.
- `e2e/tests/components/temporal-frequency-distribution.spec.ts` currently imports `@playwright/test`
  and tests transformations only. Component mounting follows
  `e2e/tests/components/chart.spec.ts`, which imports `mount` support from
  `@playwright/experimental-ct-vue`.
- Settings are normalized centrally by `normalizeTemporalFrequencyDistributionSettings` in
  `app/lib/visualization-types.ts`. Do not change its persisted shape or defaults for this UX work.

## Commands you will need

| Purpose         | Command                                                   | Expected on success             |
| --------------- | --------------------------------------------------------- | ------------------------------- |
| Component tests | `pnpm test:ct -- temporal-frequency-distribution.spec.ts` | exit 0; all selected tests pass |
| Typecheck       | `pnpm types:check`                                        | exit 0; no type errors          |
| Formatting      | `pnpm format:check`                                       | exit 0                          |
| Lint            | `pnpm lint:check`                                         | exit 0                          |

## Scope

**In scope** (the only source/test files to modify):

- `app/components/data-display/data-display-temporal-frequency-distribution.vue`
- `i18n/messages/en.json`
- `i18n/messages/de.json`
- `e2e/tests/components/temporal-frequency-distribution.spec.ts`
- `e2e/snapshots/components/` only if an intentional component screenshot test is added
- `advisor-plans/README.md` for status only

**Out of scope**:

- Changes to transformation, aggregation, parser, query, or settings-normalization behavior.
- Changes to the prop or emitted-event contract.
- Refactoring media source, media type, or regional components.
- Introducing a generic settings-panel/base-visualization component.
- Changing the published renderer or visualization pages.
- Redesigning shared `Chart`, `QueryDisplay`, or source-table components.

## Git workflow

- Work on the current feature branch; do not create another branch unless instructed.
- Keep this as one reviewable PR and use Conventional Commits, for example
  `feat: polish temporal visualization controls`.
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Add a complete temporal message namespace

Inventory every user-visible literal in the temporal Vue component, including computed/runtime error
messages. Add matching keys under `TemporalFrequencyDistribution` in both locale files. Cover:

- title and description;
- missing/invalid mapping headings and explanations;
- the corpus/NoSketch list-item phrase;
- frequency-mode group label;
- time unit label, placeholder, and localized `day`, `week`, `month`, `quarter`, `year` values;
- start date, exclusive-end date, and invalid-range message;
- parse-exclusion warning with a count;
- load failure;
- interval-chart title with interval count and localized unit/pluralization;
- interval control and grouping-direction labels, including accessible explanatory copy.

Prefer named parameters such as `{ count }`, `{ corpus }`, `{ noske }`, and `{ unit }`. Do not retain
the misleading `yearlyFrequencies` title for a chart that can use smaller units; existing legacy keys
may remain because other components/types still reference them.

**Verify**: `pnpm format:check` -> exit 0 and both JSON files parse.

### Step 2: Give the controls a responsive information hierarchy

In the component template, create two clearly labeled settings groups without changing their model
bindings:

1. The primary time-series settings group contains mode, time unit, start date, and exclusive end.
2. The derived interval-chart settings group contains interval size and grouping direction.

Use existing Card/Tailwind primitives. At narrow widths, controls must stack and inputs/triggers must
use the available width without causing horizontal overflow. At wider breakpoints, related controls
may share columns/rows. Remove fixed `min-w-60` behavior where it prevents fitting a 320 CSS-pixel
viewport. Keep the charts at their existing semantic positions and preserve `interactive=false`
behavior: no editable settings appear in embedded output.

Give each control/group an accessible name. Keep unique label/input associations. The reverse option
must be described in user terms (which boundary grouping starts from), not only as “Reverse”.

**Verify**: `pnpm types:check` -> exit 0.

### Step 3: Replace all temporal user-facing literals with translations

Use `t(...)` for template and runtime text, including localized unit display in select options and
interval headings. Keep persisted/internal `TemporalUnit` values in English; translate presentation
only. Do not translate NoSketch/corpus identifiers or query content. Ensure error messages exposed in
the UI are localized at the presentation boundary.

After this step, inspect the component with:

`rg -n '>[^<{]*[A-Za-z][^<{]*<|"The temporal|"Temporal |"Time unit|"Start date|"End date|"Reverse' app/components/data-display/data-display-temporal-frequency-distribution.vue`

Expected: no user-facing English literal remains; matches are limited to code identifiers/attributes
or false positives that are documented in the PR description.

### Step 4: Add component-level UX, locale, and viewport coverage

Extend the existing temporal spec so transformation tests continue to run, and add mount-based tests
for the display. Use supplied `data` to prevent network requests and provide a valid query-aligned
metadata mapping. Add fixtures/builders inside the spec rather than copying a full production query
multiple times.

At minimum verify:

- interactive mode exposes both settings groups and their accessible controls;
- setting `interactive: false`, `showHeader: false`, and `showSourceData: false` hides those surfaces;
- invalid date order exposes the localized alert;
- missing and invalid mappings expose localized notices;
- English and German render the new namespace without missing-key warnings;
- at a 320 CSS-pixel viewport, the card/control area has no horizontal overflow;
- changing mode, unit, dates, interval, direction, and source-table expansion emits a complete
  normalized `update:settings` payload (separate focused cases are acceptable).

Use role/label assertions rather than Tailwind-class assertions. A screenshot assertion is optional;
if used, commit only the Chromium snapshot generated by the configured CT project.

**Verify**: `pnpm test:ct -- temporal-frequency-distribution.spec.ts` -> exit 0 and all temporal
component and transformation tests pass.

### Step 5: Run the full PR gate

Run, in order:

1. `pnpm format:check`
2. `pnpm lint:check`
3. `pnpm types:check`
4. `pnpm test:ct -- temporal-frequency-distribution.spec.ts`

All commands must exit 0. Review `git diff --check` and `git status --short`; only in-scope files may
be modified by this work.

## Test plan

- Keep all existing parser, aggregation, settings, and chart alignment tests.
- Add component tests to the same temporal spec using the structure in `chart.spec.ts`.
- Prefer deterministic supplied NoSketch responses over mocks or live network access.
- Exercise both locales and the public presentation flags because PR 2 will document these as the
  reference component contract.

## Done criteria

- [ ] Every temporal component string visible to users comes from i18n.
- [ ] English and German contain the same new temporal message keys.
- [ ] Unit names and count-dependent interval/warning text are localized without string concatenation.
- [ ] Controls are semantically grouped and named.
- [ ] The component does not overflow horizontally at 320 CSS pixels.
- [ ] `interactive=false`, `showHeader=false`, and `showSourceData=false` remain effective.
- [ ] Settings payload shape and data/query behavior are unchanged.
- [ ] All four commands in Step 5 exit 0.
- [ ] `git diff --check` exits 0 and no out-of-scope file is modified.

## STOP conditions

Stop and report instead of improvising if:

- Achieving the layout requires changing shared UI primitives or `Chart` internals.
- Component mounting cannot resolve Nuxt auto-imported components/composables without changing the
  global CT configuration; report the missing registrations and proposed minimal test approach.
- The desired German meaning of an analytical term cannot be inferred from adjacent translations;
  list the English key and candidate wording for human confirmation.
- A control change would alter persisted settings or aggregation semantics.
- A required verification command fails twice after a reasonable scoped correction.

## Maintenance notes

- PR 2 will document the resulting component as the pilot contract, so reviewers should scrutinize
  naming, accessible labels, and the live-versus-embedded presentation flags.
- Keep layout rules local until at least the media-source migration proves a shared settings-layout
  primitive is warranted.
- Do not remove legacy yearly translation keys in this PR; their usage can be assessed separately.
