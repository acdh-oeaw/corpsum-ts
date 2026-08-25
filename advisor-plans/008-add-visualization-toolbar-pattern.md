# Plan 008: Add visualization toolbar pattern and document dynamic control population

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP conditions" section occurs, stop and report; do
> not improvise. When done, update the status row for this plan in
> `advisor-plans/README.md` unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 51efa72..HEAD -- app/components/data-display/data-display-temporal-frequency-distribution.vue app/components/ui app/components/data-display/data-display-temporal-frequency-distribution.transformations.ts app/lib/visualization-types.ts e2e/tests/components/temporal-frequency-distribution.spec.ts playwright/index.ts i18n/messages/en.json i18n/messages/de.json docs/visualization-components.md`
>
> If any in-scope file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding. On a mismatch that
> changes component contracts, settings semantics, toolbar implementation shape,
> or test setup, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `advisor-plans/006-stabilize-temporal-visualization-ux.md`,
  `advisor-plans/007-document-visualization-component-contract.md`
- **Category**: tech-debt | docs | tests
- **Planned at**: commit `51efa72`, 2026-07-12

## Why this matters

The temporal visualization now has localized and responsive controls, but the
controls are still plain bordered setting sections rather than a reusable
shadcn/Reka toolbar pattern. The legacy media and regional visualizations already
use icon toggle groups, so establishing a real toolbar wrapper now prevents each
future visualization migration from inventing a slightly different control bar.
The documentation also needs to define how toolbar options are populated from
query-derived capabilities and persisted visualization settings so coding agents
can migrate the next components consistently.

## Current state

Relevant files:

- `app/components/data-display/data-display-temporal-frequency-distribution.vue`
  - temporal reference component; owns query descriptors, transformation
    adapters, interactive controls, and complete settings emission.
- `app/components/ui/`
  - local shadcn-vue wrappers. It has `button`, `toggle-group`, `tooltip`, and
    `select`, but no `toolbar` directory.
- `e2e/tests/components/temporal-frequency-distribution.spec.ts`
  - Playwright component tests for temporal settings, i18n, responsive behavior,
    and complete settings emission.
- `playwright/index.ts`
  - Playwright CT runtime shim. It manually registers UI components used by
    temporal CT because CT runs plain Vite rather than Nuxt.
- `docs/visualization-components.md`
  - current agent-readable visualization component contract.
- `i18n/messages/en.json` and `i18n/messages/de.json`
  - user-facing text for temporal controls and any new toolbar labels/tooltips.

Current temporal control state:

```vue
<!-- app/components/data-display/data-display-temporal-frequency-distribution.vue:383 -->
<template v-if="queryableQueryCount > 0">
	<section
		v-if="interactive"
		class="space-y-4 rounded-md border p-4"
		aria-labelledby="temporal-time-series-settings"
	>
		<div>
			<h3 id="temporal-time-series-settings" class="font-medium">
				{{ t("TemporalFrequencyDistribution.settings.timeSeriesTitle") }}
			</h3>
			<p class="text-sm text-muted-foreground">
				{{ t("TemporalFrequencyDistribution.settings.timeSeriesDescription") }}
			</p>
		</div>
		<div class="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="min-w-0 space-y-1">
				<Label>{{ t("TemporalFrequencyDistribution.labels.frequencyMode") }}</Label>
				<ToggleGroup
					v-model="mode"
					class="flex w-full justify-start"
					type="single"
					:aria-label="t('TemporalFrequencyDistribution.labels.frequencyMode')"
				>
					<ToggleGroupItem value="absolute">{{ t("absolute") }}</ToggleGroupItem>
					<ToggleGroupItem value="relative">{{ t("relative") }}</ToggleGroupItem>
				</ToggleGroup>
			</div>
		</div>
	</section>
</template>
```

```vue
<!-- app/components/data-display/data-display-temporal-frequency-distribution.vue:506 -->
<section
	v-if="interactive"
	class="space-y-4 rounded-md border p-4"
	aria-labelledby="temporal-interval-settings"
>
	<div>
		<h3 id="temporal-interval-settings" class="font-medium">
			{{ t("TemporalFrequencyDistribution.settings.intervalTitle") }}
		</h3>
		<p class="text-sm text-muted-foreground">
			{{ t("TemporalFrequencyDistribution.settings.intervalDescription") }}
		</p>
	</div>
	<div class="grid min-w-0 gap-4 sm:grid-cols-2">
```

Current settings and dynamic option state:

```ts
// app/components/data-display/data-display-temporal-frequency-distribution.vue:71
const intervalOptions = temporalIntervalOptions;
const mode = ref<FrequencyMode>(normalizedSettings.value.mode);
const bucketUnit = ref<TemporalUnit>(normalizedSettings.value.bucketUnit);
const interval = ref(normalizedSettings.value.intervalSize);
const reverse = ref(normalizedSettings.value.reverseIntervals);
const expand = ref(normalizedSettings.value.sourceTableExpanded);
const rangeStart = ref(normalizedSettings.value.dateRange.start.slice(0, 10));
const rangeEnd = ref(normalizedSettings.value.dateRange.end.slice(0, 10));
```

```ts
// app/components/data-display/data-display-temporal-frequency-distribution.vue:118
const mappings = computed(() => props.metadataMappings ?? []);
const supportedBucketUnits = computed(() =>
	getAllowedTemporalBucketUnitsForMappings(mappings.value),
);
const availableBucketUnits = computed(() => {
	if (!selectedDateRange.value) return supportedBucketUnits.value;
	const { start, end } = selectedDateRange.value;
	return supportedBucketUnits.value.filter((unit) =>
		isTemporalBucketRangeSupported(new Date(start), new Date(end), unit),
	);
});
```

```ts
// app/components/data-display/data-display-temporal-frequency-distribution.vue:105
watch([mode, bucketUnit, interval, reverse, expand, rangeStart, rangeEnd], () => {
	if (!selectedDateRange.value) return;
	emit("update:settings", {
		type: defaultTemporalFrequencyDistributionSettings.type,
		mode: mode.value,
		bucketUnit: bucketUnit.value,
		dateRange: selectedDateRange.value,
		intervalSize: interval.value,
		reverseIntervals: reverse.value,
		sourceTableExpanded: expand.value,
	});
});
```

Local UI wrapper pattern to match:

```vue
<!-- app/components/ui/toggle-group/ToggleGroup.vue -->
<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import type { VariantProps } from "class-variance-authority";
import {
	ToggleGroupRoot,
	type ToggleGroupRootEmits,
	type ToggleGroupRootProps,
	useForwardPropsEmits,
} from "reka-ui";
import { type HTMLAttributes, provide } from "vue";

import type { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
```

```vue
<!-- app/components/ui/toggle-group/ToggleGroupItem.vue -->
<template>
	<ToggleGroupItem
		v-bind="forwardedProps"
		:class="cn(toggleVariants({ variant, size }), props.class)"
	>
		<slot />
	</ToggleGroupItem>
</template>
```

`reka-ui` exports the toolbar primitives needed for a real semantic toolbar:
`ToolbarRoot`, `ToolbarButton`, `ToolbarSeparator`,
`ToolbarToggleGroup`, and `ToolbarToggleItem`.

Current docs gap:

```md
<!-- docs/visualization-components.md:136 -->

### Settings and presentation

- Incoming settings are untrusted persisted data. A component **MUST** consume normalized settings;
  pages and publication code **MUST** use the shared normalizer too.
- A normalizer **MUST** accept absent, malformed, and supported legacy values; return a complete
  current shape; and avoid mutating its input.
- Only controls whose values must survive create/edit/detail/publish round trips belong in persisted
  settings. Transient hover, open popover, and request state do not.
```

The docs explain settings ownership, but they do not yet explain toolbar
composition, query-derived option population, icon/tooltip requirements, or how
agents should decide whether a toolbar control persists into settings.

Related legacy components already show why a shared toolbar wrapper is useful:

```vue
<!-- app/components/data-display/data-display-media-source.vue -->
<div class="flex flex-wrap items-center gap-3">
	<ToggleGroup v-model="chartMode" class="flex" type="single">
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger as-child>
					<div>
						<ToggleGroupItem value="bar">
							<BarChart4 class="mr-1 size-4" />
						</ToggleGroupItem>
```

`data-display-media-type.vue` and `data-display-regional-frequencies.vue` use a
similar icon-toggle pattern, including some hard-coded tooltip text in the
regional component. Do not migrate those components in this plan; use them only
as evidence for the future pattern.

## Commands you will need

| Purpose         | Command                                                                     | Expected on success                                                                             |
| --------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Inspect files   | `rg "Toolbar" app/components app/pages`                                     | existing app usage only if another branch added it; otherwise no source matches                 |
| Format check    | `pnpm format:check`                                                         | exit 0                                                                                          |
| Lint check      | `pnpm lint:check`                                                           | exit 0 or only pre-existing warnings already known in the branch                                |
| Typecheck       | `pnpm types:check`                                                          | exit 0, unless the pre-existing `app/components/chart.vue:472` TS2554 baseline is still present |
| Component tests | `pnpm test:ct e2e/tests/components/temporal-frequency-distribution.spec.ts` | all temporal CT tests pass                                                                      |
| Diff whitespace | `git diff --check`                                                          | exit 0                                                                                          |

Known baseline from plans 006/007: `pnpm types:check` previously failed only at
`app/components/chart.vue:472` with TS2554 (`Expected 1-2 arguments, but got 4`).
If that exact error remains and no new type errors appear, record it as
pre-existing. If the typecheck fails differently, treat it as a plan failure.

## Suggested executor toolkit

- Recommended model: GPT-5.2-Codex with medium reasoning. The task requires
  careful Vue/shadcn wrapper work and CT updates, but it is bounded and the
  architecture is specified here.
- Use `rg` for searches and follow the repo's existing shadcn-vue wrapper style.
- Do not use the `improve` skill while executing; this plan is the handoff.

## Scope

In scope:

- Create `app/components/ui/toolbar/Toolbar.vue`.
- Create `app/components/ui/toolbar/ToolbarButton.vue`.
- Create `app/components/ui/toolbar/ToolbarSeparator.vue`.
- Create `app/components/ui/toolbar/ToolbarToggleGroup.vue`.
- Create `app/components/ui/toolbar/ToolbarToggleItem.vue`.
- Create `app/components/ui/toolbar/index.ts`.
- Update
  `app/components/data-display/data-display-temporal-frequency-distribution.vue`
  to render its interactive controls as semantic toolbars with icons and
  accessible names/tooltips.
- Update `playwright/index.ts` to register the new toolbar components for CT if
  temporal CT cannot resolve them through Nuxt auto-imports.
- Update `e2e/tests/components/temporal-frequency-distribution.spec.ts` with
  toolbar role/name, dynamic option, settings emission, i18n, and responsive
  assertions.
- Update `i18n/messages/en.json` and `i18n/messages/de.json` only for new
  toolbar labels/tooltips or adjusted accessible names.
- Update `docs/visualization-components.md` with toolbar population rules and
  the agent specification template.

Out of scope:

- Do not migrate `data-display-media-source.vue`, `data-display-media-type.vue`,
  or `data-display-regional-frequencies.vue` in this plan.
- Do not introduce a generic base visualization component, universal settings
  type, or visualization toolbar DSL.
- Do not change temporal request identity, data transformation semantics,
  publication schema, persisted settings field names, or date-range meaning.
- Do not replace `Select`, `Input`, `Checkbox`, `Tooltip`, or `ToggleGroup`
  primitives outside the new toolbar wrapper.
- Do not fix the pre-existing `app/components/chart.vue` typecheck error unless
  explicitly assigned in a separate plan.

## Git workflow

- Branch: `advisor/008-add-visualization-toolbar-pattern`.
- Commit message style follows recent history, for example
  `feat: polish temporal visualization controls` and
  `docs: define visualization component contract`.
- Suggested commit message: `feat: add visualization toolbar pattern`.
- Do not push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add shadcn-style toolbar wrappers

Create `app/components/ui/toolbar/` with wrappers around Reka toolbar
primitives. Match the existing wrapper style used by `toggle-group` and
`button`:

- `Toolbar.vue`
  - wraps `ToolbarRoot`;
  - forwards Reka root props;
  - accepts `class?: HTMLAttributes["class"]`;
  - applies a default class suitable for responsive visualization controls:
    `flex min-w-0 flex-wrap items-center gap-2 rounded-md border bg-background p-2`;
  - allows caller classes through `cn`.
- `ToolbarButton.vue`
  - wraps `ToolbarButton`;
  - accepts button `variant` and `size` values from
    `@/components/ui/button`;
  - uses `buttonVariants({ variant, size })`;
  - defaults to `variant="ghost"` and `size="sm"` unless that conflicts with
    the local button API.
- `ToolbarSeparator.vue`
  - wraps `ToolbarSeparator`;
  - defaults to a vertical separator on normal rows and remains visually stable
    when the toolbar wraps. Keep the class minimal, for example
    `mx-1 h-6 w-px shrink-0 bg-border`.
- `ToolbarToggleGroup.vue`
  - wraps `ToolbarToggleGroup`;
  - forwards props and emits with `useForwardPropsEmits`;
  - provides `variant`/`size` context the same way `ToggleGroup.vue` does.
- `ToolbarToggleItem.vue`
  - wraps `ToolbarToggleItem`;
  - uses `toggleVariants` like `ToggleGroupItem.vue`;
  - consumes the toolbar toggle group context.
- `index.ts`
  - exports all five components.

Do not add `ToolbarLink` unless the temporal component uses a link. It does
not need one.

**Verify**:

- `rg "app/components/ui/toolbar" app/components/ui/toolbar app/components/data-display` should show only the new wrapper files and imports after later steps.
- `pnpm format:check` should either pass or fail only because unformatted files
  have not yet been formatted; before leaving this step, run the repo's normal
  formatter if you are executing in an isolated worktree.

### Step 2: Convert temporal controls to semantic toolbars

Update
`app/components/data-display/data-display-temporal-frequency-distribution.vue`.

Required behavior:

- Replace the two bordered `<section>` settings blocks with `Toolbar`
  instances. Preserve the visible headings/descriptions if they are still useful
  for scanability, but the interactive control containers themselves must be
  semantic toolbars from the new wrapper.
- Use `ToolbarToggleGroup` and `ToolbarToggleItem` for:
  - frequency mode (`absolute` / `relative`);
  - reverse interval grouping if represented as an icon toggle;
  - source data expand/collapse if moved from `CardFooter` into a toolbar
    command.
- Keep `Select` for option sets where text values matter (`bucketUnit`,
  `interval`) and keep date `Input` controls for `rangeStart`/`rangeEnd`.
  These controls may be placed inside a toolbar item wrapper/layout container,
  but do not force them into toggle items.
- Use lucide icons for toolbar controls where a familiar symbol exists. Good
  candidates:
  - `Hash` or `Sigma` for absolute frequency;
  - `Percent` for relative frequency;
  - `CalendarRange` for date range grouping or the time unit group label;
  - `CalendarDays` / `Calendar` for bucket unit;
  - `Rows3` or `Table2` for source data;
  - `ArrowLeftFromLine` / `ArrowRightFromLine` or another clear directional
    icon for reverse interval grouping.
- Icon-only controls must have an accessible name and tooltip. If a control has
  visible text, it still needs a stable accessible name through its text or an
  explicit `aria-label`.
- Use existing `Tooltip`, `TooltipTrigger`, `TooltipContent`, and
  `TooltipProvider` components; add localized keys for tooltip content if the
  existing labels are not precise enough.
- Preserve `interactive: false`: no toolbar controls should render, and chart
  output must remain unchanged.
- Preserve complete settings emission from the existing watcher. Any toolbar
  control that changes persisted settings must update the existing refs
  (`mode`, `bucketUnit`, `rangeStart`, `rangeEnd`, `interval`, `reverse`,
  `expand`) so the emitted object remains complete.
- Preserve dynamic bucket-unit population from `availableBucketUnits`. If a
  date range makes a selected bucket invalid, the existing fallback behavior
  must still normalize `bucketUnit`.

Layout requirements:

- The toolbar must wrap without horizontal overflow at 320 CSS pixels.
- Controls with text inputs/selects should have stable min/max widths such as
  `min-w-32`/`w-[...]` or responsive flex classes. Do not let date labels or
  select values force overflow.
- Avoid nested cards. The toolbar should sit within the existing `CardContent`.

**Verify**:

- `pnpm test:ct e2e/tests/components/temporal-frequency-distribution.spec.ts`
  should still pass after tests are updated in step 4.
- Manually run `rg "rounded-md border p-4\" app/components/data-display/data-display-temporal-frequency-distribution.vue`
  and confirm the old settings-section wrapper pattern is gone from temporal
  controls. Mapping warning boxes may still use `rounded-md border p-4`.

### Step 3: Make dynamic toolbar state explicit in code

Within
`app/components/data-display/data-display-temporal-frequency-distribution.vue`,
make the distinction between query-derived options and persisted adjustable
properties clear enough that future migrations can copy it.

Required code shape:

- Keep query/mapping-derived option lists in computed values. At minimum,
  `availableBucketUnits` remains derived from `metadataMappings` and selected
  date range.
- If helpful for template readability, add small computed arrays such as
  `bucketUnitOptions` or `intervalSizeOptions` that contain `{ value, label }`.
  These must be derived from existing settings/mappings, not hard-coded in the
  template.
- Persisted adjustable properties must continue to be represented by the
  existing normalized settings refs and emitted as one complete
  `TemporalFrequencyDistributionSettings` object.
- Transient toolbar state, such as tooltip open state, must not be added to
  persisted settings.

Do not move deterministic temporal domain logic out of the transformation module
unless the toolbar refactor reveals a real duplication. The existing
transformation module is already the correct owner for parser, bucket, and
interval logic.

**Verify**:

- `rg "availableBucketUnits|bucketUnitOptions|intervalSizeOptions" app/components/data-display/data-display-temporal-frequency-distribution.vue`
  shows dynamic option derivation close to the other computed settings state.
- `pnpm types:check` has no new errors beyond the known chart.vue baseline.

### Step 4: Update Playwright CT coverage

Update `e2e/tests/components/temporal-frequency-distribution.spec.ts`.

Keep existing coverage, but adjust assertions for toolbar semantics:

- Replace expectations that require settings headings if the headings were
  removed. Prefer role-based toolbar checks:
  - a toolbar for time-series controls is visible by accessible name;
  - a toolbar for interval/source controls is visible by accessible name.
- Assert frequency mode toggle items are reachable by role/name and include the
  icon-backed accessible labels, for example `Absolute` and `Relative`.
- Assert the time-unit select is populated from query-derived mappings:
  - with the existing `day` mapping, the select should offer day/week/month/
    quarter/year choices when the date range supports them;
  - with a coarser mapping, such as `sourceUnit: "year"`, finer units like
    `day` must not be available. Use the existing
    `getAllowedTemporalBucketUnitsForMappings` behavior as the source of truth.
- Assert complete settings emission still includes `mode`, `bucketUnit`,
  `dateRange`, `intervalSize`, `reverseIntervals`, and
  `sourceTableExpanded` after toolbar interactions.
- Keep the German no-missing-key render test and include at least one new
  toolbar label/tooltip in German.
- Keep the 320 CSS-pixel responsive overflow test.
- If CT cannot resolve the new toolbar wrappers, update `playwright/index.ts`
  to import and register them alongside the existing UI components.

**Verify**:

- `pnpm test:ct e2e/tests/components/temporal-frequency-distribution.spec.ts`
  exits 0.

### Step 5: Extend the visualization component contract docs

Update `docs/visualization-components.md`.

Add a section near "Settings and presentation" or immediately after it titled
`### Toolbar controls and dynamic options`.

The section must document these rules:

- Interactive visualization controls **SHOULD** use the shared shadcn/Reka
  toolbar wrappers when they form a compact set of related chart controls.
- Toolbar groups **MUST** have accessible names.
- Icon-only toolbar items **MUST** have localized accessible names and
  localized tooltips.
- Query-derived options are computed from aligned inputs such as
  `queries[index]`, `metadataMappings[index]`, response capabilities, and
  validated date/range constraints. They are not persisted as separate settings.
- Adjustable visualization properties that must survive create/edit/detail/
  publish/embed round trips **MUST** live in the visualization settings type,
  defaults, and normalizer, and the component **MUST** emit a complete
  normalized settings object after changes.
- Transient toolbar state, such as tooltip visibility, popover open state,
  hover, loading, and local focus, **MUST NOT** be persisted.
- If a query-derived option becomes unavailable, the component must either
  normalize to a valid persisted value or expose a localized invalid-state
  message. It must not silently emit an unsupported value.

Update the "Agent execution recipe" table with one toolbar-specific action,
preferably after settings normalization and before i18n inventory:

- Inventory toolbar controls.
- Classify each as query-derived, persisted adjustable property, or transient.
- Use the toolbar wrappers and prove accessible names/tooltips.

Update the copyable specification template with a `## Toolbar controls` section
that asks for:

- toolbar groups and labels;
- icon/tooltip inventory;
- query-derived option sources;
- persisted settings affected;
- transient state explicitly excluded from persistence;
- responsive behavior.

Update the verification matrix with a toolbar row requiring:

- role/name assertions;
- icon-only tooltip assertions;
- dynamic option assertions;
- settings emission assertions where controls are persisted.

Update anti-patterns with toolbar-specific pitfalls:

- hard-coded dynamic options in templates;
- icon-only controls without localized accessible names/tooltips;
- persisting transient toolbar state;
- hiding unsupported persisted values without normalization or a user-visible
  invalid state.

**Verify**:

- `rg "Toolbar controls|query-derived|transient toolbar|icon-only" docs/visualization-components.md`
  finds the new contract language.
- `pnpm format:check` passes after formatting.

### Step 6: Run final verification and review scope

Run:

- `pnpm format:check`
- `pnpm lint:check`
- `pnpm types:check`
- `pnpm test:ct e2e/tests/components/temporal-frequency-distribution.spec.ts`
- `git diff --check`
- `git status --short`

Expected results:

- Formatting passes.
- Lint passes or only reports pre-existing warnings unrelated to the changed
  files.
- Typecheck passes, or only the known `app/components/chart.vue:472` TS2554
  baseline remains.
- Temporal CT passes.
- Diff check passes.
- `git status --short` shows only in-scope files plus
  `advisor-plans/README.md` if the executor is responsible for status updates.

## Test plan

Add or update Playwright CT cases in
`e2e/tests/components/temporal-frequency-distribution.spec.ts`:

- toolbar semantics: time-series and interval/source toolbars are found by
  role/name in interactive mode and absent in `interactive: false`;
- icon controls: mode and source-data controls have accessible names and
  localized tooltip text;
- query-derived options: `availableBucketUnits` changes when mapping precision
  changes, and unsupported finer units are not offered;
- persisted controls: toolbar interactions emit a complete normalized settings
  object;
- i18n: German render has no missing-key warnings and includes toolbar labels;
- responsive: 320 CSS-pixel viewport still has no component overflow.

Use the existing tests in the same file as the structural pattern. Do not create
a new test runner.

## Done criteria

All must hold:

- [ ] `app/components/ui/toolbar/` exists with wrappers around Reka toolbar
      primitives, not plain `<div>` aliases.
- [ ] Temporal interactive controls use `Toolbar`, `ToolbarToggleGroup`,
      `ToolbarToggleItem`, `ToolbarButton`, or `ToolbarSeparator` where
      appropriate.
- [ ] Temporal toolbar controls use lucide icons where a familiar icon exists.
- [ ] Icon-only controls have localized accessible names and localized tooltips.
- [ ] Query-derived toolbar options are computed from aligned inputs and
      constraints, not persisted separately.
- [ ] Persisted adjustable properties still emit a complete normalized temporal
      settings object.
- [ ] `interactive: false` hides toolbars without changing chart output.
- [ ] `docs/visualization-components.md` explains toolbar population,
      query-derived options, persisted settings, transient state, and agent
      verification requirements.
- [ ] Temporal CT includes role/name, tooltip/i18n, dynamic option, emission, and
      responsive assertions.
- [ ] `pnpm format:check`, `pnpm lint:check`,
      `pnpm test:ct e2e/tests/components/temporal-frequency-distribution.spec.ts`,
      and `git diff --check` pass.
- [ ] `pnpm types:check` passes or reports only the known pre-existing
      `app/components/chart.vue:472` TS2554 baseline.
- [ ] No files outside the in-scope list are modified unless a STOP condition
      was raised and approved.

## STOP conditions

Stop and report back if:

- Reka toolbar primitives are unavailable or their API differs from the exports
  listed in this plan.
- Implementing toolbar wrappers requires changing the existing `Button`,
  `ToggleGroup`, `Select`, `Tooltip`, or `Checkbox` public APIs.
- The temporal component has drifted so settings are no longer represented by
  `mode`, `bucketUnit`, `rangeStart`, `rangeEnd`, `interval`, `reverse`, and
  `expand`.
- The toolbar refactor appears to require changing temporal settings field
  names, date-range semantics, publication schema, or NoSketch request identity.
- Product meaning is ambiguous for an icon-only control and no existing
  localized label clearly names it.
- A proposed abstraction would affect media source, media type, regional, or
  spatial components in this PR.
- A required verification command fails for a reason not proven to be an
  unrelated pre-existing baseline.

## Maintenance notes

This plan intentionally establishes only the primitive toolbar wrapper and the
temporal reference usage. The next visualization migrations should reuse the
toolbar wrappers but still define their own settings, query-derived option
sources, and transformation boundaries. Reviewers should scrutinize whether the
toolbar controls are genuinely accessible by role/name, whether tooltips are
localized, and whether query-derived options remain derived instead of leaking
into persisted settings.
