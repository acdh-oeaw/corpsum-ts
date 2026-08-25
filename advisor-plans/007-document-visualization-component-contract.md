# Plan 007: Document an agent-actionable visualization component contract

> **Executor instructions**: Follow this plan step by step. The documentation is an executable
> contract for humans and coding agents, not an essay. Run every verification command and confirm
> the expected result before moving on. If a STOP condition occurs, stop and report; do not invent a
> convention. When done, update this plan's row in `advisor-plans/README.md` unless told otherwise.
>
> **Drift check (run first)**:
> `git diff --stat 7eb7ded..HEAD -- docs/visualization-components.md app/components/data-display/data-display-temporal-frequency-distribution.vue app/lib/visualization-types.ts app/pages/visualization/new.vue app/pages/visualization/edit/[...id].vue app/pages/visualization/[...id].vue app/components/published/published-visualization-renderer.vue server/utils/published-visualizations.ts e2e/tests/components/temporal-frequency-distribution.spec.ts`
> Plan 006 is expected to change the temporal component, locale files, and its spec. Re-read those
> files after Plan 006 lands and use their final API/text as the source of truth. Any other material
> mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `advisor-plans/006-stabilize-temporal-visualization-ux.md`
- **Category**: docs
- **Planned at**: commit `7eb7ded`, 2026-07-12

## Why this matters

`docs/visualization-components.md` describes an older, yearly-only temporal interface and no longer
matches the component's required `queries` prop, supplied-data mode, settings emission, fine-grained
units, or embedded/published boundary. The next migrations need a reliable protocol that a coding
agent with no prior conversation can follow. This PR replaces stale claims and turns the temporal
implementation into an actionable Markdown template/checklist without prematurely creating a base
component.

## Current state

- The temporal component currently accepts required `queries` plus optional `settings`, positional
  `metadataMappings`, positional supplied `data`, and presentation flags `interactive`, `showHeader`,
  and `showSourceData`. It emits a complete `update:settings` payload.
- Supplied data is a boundary: `data === undefined` means the component queries NoSketch; passing an
  array, including nullish entries, means it must render from the supplied snapshot and not fetch.
- `app/lib/visualization-types.ts` owns visualization registration, metadata semantics, settings
  types/defaults/normalization, and legacy settings migration.
- Create/edit/detail pages demonstrate settings ownership and metadata orchestration. The published
  renderer demonstrates immutable snapshot rendering using supplied data and the mapping captured at
  publication time.
- `server/utils/published-visualizations.ts` owns publication-time cache/snapshot assembly and is part
  of the boundary even though display components must not import server code.
- The existing guide incorrectly shows `queries?`, names a non-existent
  `DataDisplayMetadataTemporalFrequencyDistribution`, describes only yearly buckets, contains parser
  examples missing current `sourceUnit`, and documents legacy `yearRange` as though it were the
  current persisted shape.
- Repository verification commands are `pnpm format:check`, `pnpm lint:check`, `pnpm types:check`,
  `pnpm test:ct`, and `pnpm test:e2e`.

## Commands you will need

| Purpose                  | Command                                                   | Expected on success |
| ------------------------ | --------------------------------------------------------- | ------------------- | --------- | -------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Locate stale claims      | `rg -n 'queries\?                                         | DataDisplayMetadata | yearRange | yearly buckets | parser.*mode.*year' docs/visualization-components.md` | no stale API examples after rewrite; legitimate legacy-migration section may match `yearRange` |
| Format docs              | `pnpm format:check`                                       | exit 0              |
| Validate referenced API  | `pnpm types:check`                                        | exit 0              |
| Validate reference tests | `pnpm test:ct -- temporal-frequency-distribution.spec.ts` | exit 0              |

## Scope

**In scope**:

- `docs/visualization-components.md`
- `advisor-plans/README.md` for status only

**Read-only sources of truth**:

- `app/components/data-display/data-display-temporal-frequency-distribution.vue`
- `app/components/data-display/data-display-temporal-frequency-distribution.transformations.ts`
- `app/lib/visualization-types.ts`
- `app/composables/use-noske-freqml-queries.ts`
- `app/pages/visualization/new.vue`
- `app/pages/visualization/edit/[...id].vue`
- `app/pages/visualization/[...id].vue`
- `app/components/published/published-visualization-renderer.vue`
- `server/utils/published-visualizations.ts`
- `e2e/tests/components/temporal-frequency-distribution.spec.ts`

**Out of scope**:

- Source-code, type, test, locale, or runtime changes.
- Claiming that every temporal implementation detail is mandatory for categorical/spatial displays.
- Designing a universal base Vue component or composable.
- Writing migration-specific plans for media source, media type, or regional/spatial displays.
- General contributor/onboarding documentation unrelated to MD-driven visualizations.

## Git workflow

- Work on the current feature branch after Plan 006.
- Use a documentation Conventional Commit such as
  `docs: define visualization component contract`.
- Do not push or open a PR unless instructed.

## Required document architecture

Rewrite `docs/visualization-components.md` into the following ordered sections. A coding agent must be
able to start at the checklist and execute without access to this plan or prior discussion.

1. **Purpose and status**: state that this is the pilot contract for MD-driven visualization
   components, with temporal as the proven example; conventions are mandatory only where explicitly
   marked.
2. **Architecture and ownership**: a concise flow from visualization definition, page orchestration,
   component, live NoSketch response or supplied snapshot, settings persistence, publication capture,
   to embedded rendering. State which layer owns each responsibility.
3. **Public component contract**: exact temporal props/defaults, emitted event, positional alignment
   invariants, and the distinction between `undefined` and a supplied data array.
4. **Behavioral boundaries**: live fetching, snapshot rendering, interactive/read-only behavior,
   header/source-data flags, missing/invalid mapping behavior, partial data/loading/errors, empty data,
   and settings normalization/backward compatibility.
5. **Temporal reference implementation**: current settings JSON, mapping/parser schema including
   `sourceUnit`, date-range end exclusivity, supported units, and why transformations remain outside
   the Vue template.
6. **Agent execution recipe**: an ordered, imperative procedure for adding/refactoring a visualization.
7. **Copyable Markdown specification template**: a fenced Markdown block agents can copy into a new
   visualization design document and fill in.
8. **Verification matrix and done checklist**: exact repository commands plus behavior cases.
9. **Anti-patterns and STOP rules**: conditions under which an agent must ask instead of generalizing.
10. **Known follow-ups**: media source pilot, then media type, then regional/spatial; explicitly defer
    shared code extraction until duplication is proven.

## Steps

### Step 1: Reconcile the guide with the post-Plan-006 implementation

Read every read-only source-of-truth file listed above. Replace obsolete names, optionality, settings,
and parsing claims. Include short code examples copied from the live public types and call sites, but
do not duplicate large component bodies. All examples must type-check conceptually against the final
source.

Clearly label:

- **mandatory protocol**: registration, typed settings/normalization when settings exist, aligned
  query/result arrays, live-versus-supplied-data boundary, settings ownership, published rendering,
  i18n/accessibility, tests;
- **temporal-specific example**: metadata parser, source precision, bucket generation, date range;
- **candidate convention awaiting validation**: any helper/component extraction proposed for later
  categorical/spatial migrations.

**Verify**: run the stale-claim `rg` command from the command table. Expected: only an intentionally
labelled legacy migration example may mention `yearRange`; no obsolete component name or optional
queries prop remains.

### Step 2: Specify ownership and invariants as decision rules

Write direct “MUST / SHOULD / MUST NOT” rules where violating the rule would break persistence,
publishing, or rendering. At minimum specify:

- pages own selection, metadata lookup/editing, and persisted settings collections;
- components own query descriptors, response transformation, display controls, and emitting complete
  normalized settings;
- settings defaults and normalization live beside visualization definitions, not only in component
  refs;
- supplied snapshot data disables live queries;
- arrays aligned to `queries` preserve indexes even for missing results/mappings;
- published output uses captured settings/mappings/data and must not depend on later mapping changes;
- presentation flags do not change data semantics;
- raw NoSketch responses should be typed from `lib/noske-types.d.ts` rather than duplicated where the
  generated type is usable;
- user-facing text requires English and German keys and accessible control names.

Include a compact table mapping responsibility to owner and evidence path.

**Verify**: manually cross-check every evidence path exists with
`test -e <path>` for each referenced file -> every invocation exits 0.

### Step 3: Add the coding-agent recipe

Provide an ordered procedure that names exact integration points and produces a reviewable vertical
slice. It must tell an agent to:

1. Inspect the target legacy component and published-renderer branch.
2. Define/extend `visualizationDefinitions` and semantic dependencies.
3. Define settings type, defaults, and normalizer only for persisted controls.
4. Define component props/emits and query-aligned data types.
5. Implement the live/supplied-data switch without network access in snapshot mode.
6. Keep pure response transformation/testable logic outside complex template expressions.
7. Wire create/edit/detail/published call sites.
8. Add both locale files and accessibility labels.
9. Add transformation, component, live-boundary, supplied-data, settings, error, and responsive tests
   as applicable.
10. Run scoped checks, then the repository gates.

For each step, state the expected artifact and a verification method. Tell agents to use `rg` to find
all call sites before changing a contract and to keep commits/PRs limited to one visualization.

### Step 4: Add a copyable specification template

Add a fenced `markdown` template with fill-in fields, not temporal answers. It must include:

- visualization identifier and user outcome;
- inputs, props/defaults, emits, settings schema/defaults/normalization;
- metadata semantics/mappings;
- NoSketch endpoint/query descriptor and cache-key inputs;
- raw response type and pure transformation output;
- live, supplied snapshot, loading, empty, partial error, and invalid-config behavior;
- interactive, detail, published, and embedded presentation;
- i18n and accessibility inventory;
- files/call sites to change;
- test matrix and commands;
- explicit non-goals, assumptions, open decisions, STOP conditions, and done criteria.

The template must instruct its user to replace every placeholder and delete non-applicable sections;
an unfilled marker such as `<REQUIRED>` must be machine-searchable.

**Verify**:
`rg -n '<REQUIRED>' docs/visualization-components.md` -> matches only inside the intentionally copyable
template and its instruction, not the completed temporal reference sections.

### Step 5: Add verification and anti-generalization safeguards

End the guide with a matrix covering, where applicable:

- settings absent, valid, legacy, and malformed;
- one and multiple queries;
- missing positional mapping/result;
- live success/loading/error and supplied-data success/null/empty;
- interactive detail and non-interactive embedded rendering;
- header/source-table flags;
- English/German and accessible controls;
- narrow and wide viewport behavior;
- publishing round trip preserving captured output.

Add STOP rules telling agents not to improvise when a visualization needs a new metadata semantic,
the NoSketch response cannot be represented by existing generated types, publication would require a
snapshot schema change, positional alignment cannot be maintained, a proposed abstraction has only
one consumer, or product meaning/translation is ambiguous.

**Verify**: `pnpm format:check` -> exit 0.

### Step 6: Validate the guide against the executable reference

Run:

1. `pnpm types:check`
2. `pnpm test:ct -- temporal-frequency-distribution.spec.ts`
3. `pnpm format:check`
4. `git diff --check`

Expected: all exit 0. Then follow the agent recipe mentally for the media-source component and note
any instruction that still requires undocumented session knowledge. Tighten the guide until every
step points to a file, decision rule, artifact, and verification method; do not start that migration.

## Test plan

This is documentation-only. Its executable checks are:

- existing type checking confirms referenced APIs still exist;
- the post-Plan-006 temporal CT spec confirms the documented reference behavior;
- searches detect stale names and unfilled placeholders;
- the final dry run against media source tests whether a zero-context agent could apply the recipe.

Do not change tests to make the documentation pass.

## Done criteria

- [ ] The guide matches the final post-Plan-006 temporal API and behavior.
- [ ] Current settings and parser examples include `dateRange`, `bucketUnit`, and `sourceUnit`.
- [ ] Live versus supplied snapshot data semantics are explicit, including `data === undefined`.
- [ ] Every important responsibility has a named owner and evidence path.
- [ ] Mandatory, temporal-specific, and provisional conventions are visibly distinguished.
- [ ] A zero-context coding agent gets an ordered recipe with artifacts and verification per step.
- [ ] The copyable Markdown specification template contains every field listed in Step 4.
- [ ] Verification matrix, done checklist, anti-patterns, and STOP conditions are present.
- [ ] No source/test/runtime file is modified.
- [ ] All Step 6 commands exit 0.

## STOP conditions

Stop and report instead of improvising if:

- Plan 006 changes the public prop/event/settings boundary rather than presentation only.
- Source files disagree about whether published data/settings/mappings are captured or live.
- A claimed general rule is supported only by temporal behavior and cannot be labelled provisional.
- Accurately documenting the boundary requires a source-code correction.
- The guide would need to promise a future spatial/media semantic schema that does not yet exist.
- A verification command fails twice; report whether the failure predates this docs-only PR.

## Maintenance notes

- Review this PR as an API contract: incorrect documentation will be copied into three migrations.
- Keep the guide close to executable evidence and update it whenever visualization props, settings,
  publication snapshots, or orchestration ownership change.
- After the media-source migration, revise provisional advice and extract shared code only where two
  independently working components demonstrate the same stable responsibility.
