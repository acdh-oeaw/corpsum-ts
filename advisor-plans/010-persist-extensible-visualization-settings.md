# Plan 010: Persist Extensible Per-Visualization Analysis Settings

> **Executor instructions**: Follow this plan step by step. Preserve type-specific settings rather
> than collapsing unlike analyses into one generic object. Run every verification command. Stop at
> the conditions below instead of inventing future product semantics. Update the README status when
> done.
>
> **Drift check (run first)**:
> `git diff --stat 539026e..HEAD -- app/lib/visualization-types.ts app/components/data-display/data-display-media-source.vue app/components/data-display/data-display-media-type.vue app/components/data-display/data-display-regional-frequencies.vue app/pages/visualization/new.vue app/pages/visualization/edit/[...id].vue app/pages/visualization/[...id].vue app/components/published/published-visualization-renderer.vue server/utils/published-visualizations.ts server/models/visualizations.schema.ts e2e/tests/components`
> Reconcile all changed settings contracts before execution. Material ambiguity in persisted meaning
> is a STOP condition.

## Status

- **Review reference**: `DDR-02`
- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: Plan 009
- **Category**: feature, persistence, architecture
- **Planned at**: commit `539026e`, 2026-07-23

## Why this matters

Media and regional controls are component-local refs. Saved visualizations and immutable published
snapshots therefore lose the user's frequency/chart/map choices, and embeds render hard-coded
defaults with no controls to recover the intended state.

The settings architecture must also remain open to independently shaped future analysis families:
geospatial, personal, organisational, and other domain-specific visualizations must be able to add
their own defaults, validation, and legacy migration without expanding one universal settings blob
or copying temporal conditionals through every page and server path.

## Required outcome and design guardrail

Create an exhaustive, type-indexed settings boundary in `app/lib/visualization-types.ts`. Each
visualization type owns a complete settings type, defaults, and total normalizer. Dispatch may use a
typed codec/definition registry or another exhaustive mechanism, but callers continue to use shared
`getDefaultVisualizationSettings(type)` and `normalizeVisualizationSettings(type, value)` entry
points.

Current settings to persist:

- media source: frequency mode, bar layout mode, source-table expansion;
- media type: frequency mode, bar layout mode, source-table expansion;
- regional: frequency mode, combined/separate map mode, bar layout mode, source-table expansion;
- temporal: preserve the existing schema and migration behavior unchanged.

Keep separate media-source and media-type settings types even if fields currently match, so they
can diverge later. Do not add speculative geospatial/personal/organisational fields now; provide the
typed extension seam for their future codecs.

## Scope

**In scope**:

- `app/lib/visualization-types.ts`
- the three migrated non-temporal display components
- visualization create, edit, and detail orchestration
- `app/components/published/published-visualization-renderer.vue`
- `server/utils/published-visualizations.ts`
- focused settings/component/publication tests
- both locale files only if new accessible labels or validation messages are required

**Out of scope**:

- Changing temporal setting field names/defaults.
- Adding settings for future visualization types or metadata semantics.
- Persisting hover, popover, tooltip, focus, loading, or request-error state.
- A universal settings form, visualization base component, or JSON-schema framework.
- Migrating the three legacy non-metadata components; Plan 014 consumes the extension seam later.

## Git workflow

- Suggested branch: `advisor/010-persist-extensible-visualization-settings`
- Suggested commit: `feat: persist visualization-specific display settings`
- Keep schema/API compatibility for visualizations whose settings entries are `{}` or absent.

## Steps

### Step 1: Define typed settings families and total normalizers

Add discriminated settings types, immutable defaults, and pure normalizers for media source, media
type, and regional displays. Normalizers must accept `unknown`, return a complete current shape,
avoid input mutation, and safely migrate absent or malformed stored values to defaults.

Introduce an exhaustive type-to-settings mapping/codec boundary. Adding a future visualization type
should require adding its codec in one obvious registry or exhaustive dispatch, not editing ad hoc
conditionals in create, edit, detail, publication, and embed code.

Add focused cases for absent, valid, partial, malformed, and extra-field inputs. Preserve temporal
legacy cases.

### Step 2: Convert components to controlled persisted settings

Each component accepts optional partial settings, normalizes them, synchronizes local controls when
props change, and emits a complete normalized `update:settings` payload after a persisted control
changes. `interactive: false` hides controls without changing the normalized selected output.

Do not emit while merely synchronizing an equivalent incoming value. Keep request state and popover
state local.

### Step 3: Wire create/edit/detail ownership

Replace temporal-only settings update code with a type-aware update path. Create and edit pages must
mount enough preview/control UI for every selected migrated visualization to let users choose and
save its settings. The settings array must remain index-aligned with `visualizations` through add,
remove, reorder, load, and save.

Detail pages consume normalized saved settings. If detail controls remain interactive for temporary
exploration, make it clear that publishing uses saved settings; do not silently publish unsaved
local choices. Prefer configuring persistent choices in create/edit.

### Step 4: Preserve settings through publication and embed

Remove the temporal-only gate in `getVisualizationSettings`. Capture normalized settings for every
published panel/type, reconstruct one aligned settings value in the published renderer, and pass it
to the corresponding component. Published and embedded output must match the saved mode/layout even
when `interactive` is false.

No published schema bump is expected because panel settings already exist as `unknown`. If a bump is
actually required, stop.

### Step 5: Add round-trip coverage and run gates

Cover:

- normalizer behavior for each type;
- complete settings emissions;
- visualization/settings index alignment;
- create/edit save and reload;
- publication capture and published/embed reconstruction;
- non-interactive output retaining saved absolute/chart/map modes.

Run `pnpm test:ct`, the focused publication/API tests available in the repo, `pnpm types:check`,
`pnpm format:check`, `pnpm lint:check`, and `git diff --check`.

## Done criteria

- [ ] Every migrated visualization has an independently typed settings family and normalizer.
- [ ] The settings dispatch is exhaustive and has a clear future extension point.
- [ ] No speculative future analysis fields were added.
- [ ] Create/edit/save/detail/publish/embed preserve selected settings.
- [ ] Non-interactive rendering retains output semantics while hiding controls.
- [ ] Settings arrays remain aligned with visualization arrays.
- [ ] Tests and repository gates pass.
- [ ] The README status row for Plan 010 is updated.

## STOP conditions

Stop if product meaning/defaults for a current control are disputed; if personal/organisational or
geospatial settings must be designed now rather than merely supported by an extension seam; if the
existing persistence model cannot retain settings without schema/version changes; or if duplicate
visualization types require per-instance rather than per-type settings and current storage cannot
represent them.

## Maintenance notes

Future settings families should be small domain contracts. Shared fields may use helpers, but their
owning type retains its own defaults and normalizer so unlike analysis semantics are never coupled.
