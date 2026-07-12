# Visualization component contract

## Purpose and status

This guide is the pilot contract for Markdown-driven visualization components. It is written for
contributors and coding agents that have no prior project context. The temporal frequency
distribution is the proven reference implementation; it is an example, not a universal base
component.

Rules marked **MUST**, **SHOULD**, or **MUST NOT** are the mandatory protocol. Sections marked
**Temporal example** describe temporal-only behavior. A **candidate convention** is not a rule until
a later migration proves that it has more than one consumer.

The protocol covers a complete vertical slice: registration, page orchestration, live NoSketch
queries, supplied snapshots, settings persistence, publishing, embedded rendering, localization,
accessibility, and tests.

## Architecture and ownership

The data flow is:

1. `visualizationDefinitions` registers the identifier, metadata semantics, NoSketch target, and
   persisted search key.
2. create, edit, and detail pages select queries, resolve metadata, normalize settings, and pass
   query-aligned inputs to the display component.
3. the component builds query descriptors. It either fetches live NoSketch responses or consumes
   supplied snapshot responses, then transforms and renders them.
4. the create/edit page owns the settings collection and replaces the entry for a visualization
   when the component emits complete normalized settings.
5. publication resolves the same request identity, settings, and mappings, then captures cached raw
   responses in immutable panel snapshots.
6. the published renderer reconstructs query-aligned arrays and passes the captured inputs back to
   the component. Embed mode changes presentation, not data semantics.

| Responsibility                                                             | Owner                            | Evidence                                                                                                             |
| -------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| visualization identifier, metadata dependencies, target path, search key   | `app/lib/visualization-types.ts` | `visualizationDefinitions`                                                                                           |
| settings type, defaults, validation, legacy migration                      | `app/lib/visualization-types.ts` | temporal settings and normalizer                                                                                     |
| selected queries, metadata lookup/editing, persisted settings collection   | create/edit/detail pages         | `app/pages/visualization/new.vue`, `app/pages/visualization/edit/[...id].vue`, `app/pages/visualization/[...id].vue` |
| query descriptors, live/snapshot switch, response transformation, controls | display component                | `app/components/data-display/data-display-temporal-frequency-distribution.vue`                                       |
| reusable pure domain transformation                                        | adjacent transformation module   | `app/components/data-display/data-display-temporal-frequency-distribution.transformations.ts`                        |
| executing aligned frequency queries                                        | frequency-query composable       | `app/composables/use-noske-freqml-queries.ts`                                                                        |
| publication-time request identity and snapshot assembly                    | server publication utility       | `server/utils/published-visualizations.ts`                                                                           |
| reconstructing aligned captured inputs and embedded presentation           | published renderer               | `app/components/published/published-visualization-renderer.vue`                                                      |
| generated raw response types                                               | generated NoSketch declarations  | `lib/noske-types.d.ts`                                                                                               |

Decision rules:

- Pages **MUST** own selection, metadata lookup and editing, and the persisted settings collection.
- Components **MUST** own their query descriptors, raw-response transformation, display controls,
  and complete normalized settings emission.
- Settings defaults and normalization **MUST** live beside visualization definitions, not only in
  component refs. A page, server process, or published renderer must be able to normalize without
  mounting Vue.
- The persisted `visualizations`, `settings`, and any per-visualization data collections **MUST**
  preserve matching indexes. Query-aligned props and snapshot panels **MUST** likewise preserve the
  index of each query even when an entry is missing.
- A component **MUST NOT** import server code. Publication code **MUST** reproduce the component's
  request identity and snapshot inputs at the server boundary.
- Published output **MUST** use captured settings, mappings, and raw data. It **MUST NOT** resolve a
  later mapping or depend on a changed default.
- Raw responses **SHOULD** use types from `lib/noske-types.d.ts` when a generated schema represents
  them. Do not duplicate a response interface merely to rename generated fields.
- User-facing text **MUST** have English and German locale keys. Every control **MUST** have an
  accessible name and the layout **MUST** work at narrow and wide viewports.

## Public component contract

The temporal reference has this effective public API:

```ts
type FreqMlResponse = components["schemas"]["11_freqml"];

interface TemporalFrequencyDistributionProps {
	queries: Array<CorpusQuery>;
	settings?: Partial<TemporalFrequencyDistributionSettings>;
	metadataMappings?: Array<CorpusMetadataMappingResponse | null>;
	data?: Array<FreqMlResponse | null | undefined>;
	interactive?: boolean;
	showHeader?: boolean;
	showSourceData?: boolean;
}

interface TemporalFrequencyDistributionDefaults {
	settings: undefined;
	metadataMappings: undefined;
	data: undefined;
	interactive: true;
	showHeader: true;
	showSourceData: true;
}

interface TemporalFrequencyDistributionEmits {
	"update:settings": [settings: TemporalFrequencyDistributionSettings];
}
```

`queries` is required. `metadataMappings[index]`, `data[index]`, the live query descriptor at
`index`, and every derived loading/error/result entry refer to `queries[index]`. Repeated corpus
mappings still appear once per query. Lookup may deduplicate network requests, but the component
boundary remains positional.

The live/snapshot distinction depends on prop presence, not array contents:

- `data === undefined`: live mode. The component may execute enabled NoSketch requests.
- `data !== undefined`: supplied snapshot mode. The component **MUST NOT** fetch. `[]`, `[null]`, and
  sparse arrays are valid supplied inputs and represent missing/empty positional results; they do
  not fall back to the network.

The component emits a complete normalized settings object, never a field-level patch. The parent
replaces its settings entry:

```ts
function updateTemporalSettings(settings: TemporalFrequencyDistributionSettings) {
	settingsByType.value = {
		...settingsByType.value,
		[temporalFrequencyDistributionType]: settings,
	};
}
```

## Behavioral boundaries

### Live fetching and supplied snapshots

- A query descriptor **MUST** exist for every query so keys and positional state remain stable.
- Live requests **MUST** be disabled for a missing or invalid required mapping and while supplied
  data is present. Other valid query indexes may continue; invalid configuration is positional.
- Cache keys **MUST** include every input that changes the upstream response, including NoSketch
  instance, corpus/subcorpus, metadata attribute, facets/query JSON, and endpoint-specific params.
- Supplied responses **MUST** pass through the same transformation and rendering path as live
  responses.
- A supplied `null` or missing entry **MUST NOT** trigger a fetch. Render the documented missing or
  empty state for that index.

### Settings and presentation

- Incoming settings are untrusted persisted data. A component **MUST** consume normalized settings;
  pages and publication code **MUST** use the shared normalizer too.
- A normalizer **MUST** accept absent, malformed, and supported legacy values; return a complete
  current shape; and avoid mutating its input.
- Only controls whose values must survive create/edit/detail/publish round trips belong in persisted
  settings. Transient hover, open popover, and request state do not.
- `interactive: false` hides editing controls but **MUST NOT** change the selected mode, range,
  transformation, or results.
- `showHeader` and `showSourceData` control presentation only. They **MUST NOT** change query keys,
  fetching, transformation, or chart output.
- Embedded published rendering uses captured data with non-interactive presentation. A normal
  published page may expose presentation controls only where they do not mutate the snapshot.

### Missing, invalid, partial, and empty input

- Missing required mappings and invalid mappings are distinct configuration states and **SHOULD**
  have localized messages that identify affected queries.
- Loading and request errors are tracked per query. One failed result **MUST NOT** shift or relabel
  another query's series.
- Valid query indexes **SHOULD** remain usable when another index has a missing mapping, parser
  error, request error, or supplied `null` result.
- An empty successful response renders a stable empty chart/table state; it **MUST NOT** be treated
  as permission to refetch.
- Invalid raw values may be excluded only when the domain contract defines that behavior. If they
  are excluded, expose a localized warning or other reviewable signal.
- Loading indicators and errors belong to the query they describe. Do not collapse positional
  state into a single result unless the visualization specification explicitly requires all-or-none
  behavior.

## Temporal reference implementation

This section is a **temporal example**, not a requirement for categorical or spatial displays.

### Current settings

```json
{
	"type": "data-display-metadata-temporal-frequency-distribution",
	"mode": "relative",
	"bucketUnit": "year",
	"dateRange": {
		"start": "1986-01-01T00:00:00.000Z",
		"end": "2025-01-01T00:00:00.000Z"
	},
	"intervalSize": 2,
	"reverseIntervals": false,
	"sourceTableExpanded": false
}
```

`dateRange.end` is exclusive. The default therefore includes dates from 1986 through 2024. The
normalizer converts the legacy `yearRange: { start: 2020, end: 2024 }` shape to an end-exclusive
range ending at `2025-01-01T00:00:00.000Z`. Legacy input is accepted for migration but is not the
current persisted shape.

Supported source and bucket units are `day`, `week`, `month`, `quarter`, and `year`. A bucket may not
claim greater precision than every aligned source mapping. The implementation also caps generated
buckets at 10,000 and falls back through shared normalization when a persisted range/unit is invalid.

### Mapping and parser schema

```json
{
	"attribute": "doc.publication_date",
	"parser": {
		"mode": "date",
		"sourceUnit": "day"
	},
	"valueMap": {
		"unknown-session": "2020-01-15"
	},
	"label": "Temporal distribution",
	"description": ""
}
```

The mapping's `mode` is `year`, `date`, or `regex`; every parser declares `sourceUnit`. `valueMap` is
applied before parsing. `year` accepts a four-digit year. `date` parses the value at the declared precision.
`regex` first requires a match, then uses the named `date` or `year` group, the first capture, or the
whole match. For example:

```json
{
	"mode": "regex",
	"sourceUnit": "day",
	"pattern": "date=(?<date>\\d{4}-\\d{2}-\\d{2})"
}
```

Malformed regular expressions are invalid configuration, not thrown render-time exceptions.
Calendar-invalid dates and invalid ISO weeks are rejected. Weekly-to-yearly aggregation follows the
ISO week-year.

Parser creation, precision rules, bucket generation, aggregation, interval grouping, and date
formatting live in
`app/components/data-display/data-display-temporal-frequency-distribution.transformations.ts`.
Keeping deterministic domain operations outside complex Vue template expressions makes them usable
by component tests and reviewable without mounting the page. Small rendering adapters may remain in
the component; reusable domain logic should not be embedded in the template.

## Agent execution recipe

Use this recipe for one visualization per commit or PR. Before changing a public contract, run `rg`
for the component name, visualization identifier, search key, settings type, and published-renderer
branch to find every call site. If `rg` is unavailable, use an equivalent recursive search.

| Step | Action                                                                                                                                                                                                         | Expected artifact                                        | Verification                                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1    | Inspect the target legacy component and its branch in `app/components/published/published-visualization-renderer.vue`. Record its live inputs, transformations, controls, errors, and publication differences. | filled specification based on the template below         | every claim points to a current file/call site                                                                      |
| 2    | Define or extend the entry in `visualizationDefinitions`, including semantic dependencies, target path, published-panel decision, and stable search key.                                                       | typed registry entry in `app/lib/visualization-types.ts` | `pnpm types:check`; search for identifier/search-key consumers                                                      |
| 3    | If controls are persisted, define the settings type, complete defaults, and a total normalizer beside the registry. Include supported legacy migration only when evidence exists.                              | settings type/default/normalizer and focused cases       | absent, valid, malformed, and legacy inputs return documented current shapes                                        |
| 4    | Define component props/emits and generated raw-response type. Require `queries`; make result/mapping arrays explicitly query-aligned; emit complete settings.                                                  | reviewable TypeScript public contract                    | all call sites found in step 1 satisfy optionality and defaults                                                     |
| 5    | Implement one live/supplied-data switch. Presence of `data` disables all network queries; map both sources by query index into one transformation path.                                                        | descriptors plus aligned result/loading/error arrays     | a component test proves supplied `[]`/`null` cannot invoke the live request path                                    |
| 6    | Move deterministic parsing, normalization, aggregation, or geometry out of complex template expressions into an adjacent transformation module when it is substantial.                                         | typed pure functions                                     | focused tests cover malformed and boundary inputs without page setup                                                |
| 7    | Wire create, edit, detail, `server/utils/published-visualizations.ts`, and the published renderer. Preserve visualization/query indexes and captured settings/mappings/data.                                   | one complete live-to-published vertical slice            | create/edit round trip and publication snapshot/render tests or an explicit manual proof                            |
| 8    | Inventory every heading, label, description, warning, error, unit, and table header. Add English and German keys and accessible names.                                                                         | matching locale entries and labelled controls            | render both locales; query controls by accessible role/name; no missing-key warnings                                |
| 9    | Add applicable transformation, component, live-boundary, supplied-data, settings, partial-error, invalid-config, accessibility, responsive, and publication tests.                                             | focused tests near existing Playwright CT/E2E suites     | run the scoped spec first; inspect snapshots only when intentionally changed                                        |
| 10   | Run repository gates and review the diff for unrelated work.                                                                                                                                                   | a single-visualization commit/PR                         | `pnpm format:check`, `pnpm lint:check`, `pnpm types:check`, `pnpm test:ct`, `pnpm test:e2e`, and `git diff --check` |

At every step, preserve the behavior described in the specification. Do not extract a shared base
component while completing the first consumer. A small helper is acceptable only when its contract
is already proven independently or duplication exists in at least two migrated consumers.

## Copyable Markdown specification template

Copy the fenced block into a design document. Replace every `<REQUIRED> ...` marker and delete
sections that truly do not apply. Do not begin implementation while any required marker remains.

```markdown
# <REQUIRED> visualization name implementation specification

## Identity and user outcome

- Identifier: `<REQUIRED> data-display-...`
- User outcome: <REQUIRED> what question the visualization answers
- Stable search key: `<REQUIRED> persisted/source-table key`
- NoSketch target: `<REQUIRED> endpoint or explicit none`

## Inputs and public contract

- `queries`: <REQUIRED> required type and ordering semantics
- Props/defaults: <REQUIRED> exact prop types and runtime defaults
- Emits: <REQUIRED> exact events and complete payload types
- Query-aligned arrays: <REQUIRED> mappings/results and missing-entry representation

## Settings

- Persisted schema: <REQUIRED> current complete settings shape or explicit none
- Defaults: <REQUIRED> complete defaults or explicit none
- Normalization: <REQUIRED> absent/malformed/current behavior
- Legacy migration: <REQUIRED> supported legacy shapes with evidence, or explicit none
- Transient controls excluded from persistence: <REQUIRED> list or explicit none

## Metadata semantics and mappings

- Required semantics: <REQUIRED> registered semantics or explicit none
- Mapping schema and precedence: <REQUIRED> fields, lookup owner, and override behavior
- Missing/invalid mapping behavior: <REQUIRED> per-query behavior

## NoSketch request and cache identity

- Endpoint and method: <REQUIRED> target
- Query descriptor/params: <REQUIRED> exact response-changing inputs
- Cache-key inputs: <REQUIRED> every response-changing input
- Enabled conditions: <REQUIRED> live, mapping, and validation conditions

## Raw response and transformation

- Generated raw response type: <REQUIRED> `lib/noske-types.d.ts` schema or justified gap
- Pure transformation input/output: <REQUIRED> types and invariant
- Transformation module: <REQUIRED> file path or reason no module is needed

## Behavioral states

| State                         | Required behavior                                 |
| ----------------------------- | ------------------------------------------------- |
| live loading                  | <REQUIRED> per-query and aggregate presentation   |
| live success                  | <REQUIRED> rendering                              |
| live error                    | <REQUIRED> partial/all-failure behavior           |
| supplied snapshot             | <REQUIRED> no-network proof and rendering         |
| supplied `null`/missing entry | <REQUIRED> positional behavior                    |
| empty response/array          | <REQUIRED> stable empty state                     |
| partial error                 | <REQUIRED> valid sibling-query behavior           |
| invalid configuration         | <REQUIRED> blocking versus per-query continuation |

## Presentation contexts

- interactive create/edit/detail: <REQUIRED> available controls and ownership
- read-only detail: <REQUIRED> behavior or explicit none
- published page: <REQUIRED> captured inputs and allowed controls
- embedded: <REQUIRED> header/source/interaction flags and unchanged data semantics

## i18n and accessibility inventory

- English/German keys: <REQUIRED> headings, labels, descriptions, warnings, errors, units, tables
- Accessible names/relationships: <REQUIRED> controls, groups, alerts, chart alternatives
- Responsive behavior: <REQUIRED> narrow and wide expectations

## Integration files

- Registry/types: <REQUIRED> paths
- Component/transformation: <REQUIRED> paths
- Create/edit/detail call sites: <REQUIRED> paths
- Publication capture/renderer: <REQUIRED> paths
- Locales/tests: <REQUIRED> paths

## Test matrix and commands

- Focused cases: <REQUIRED> settings, alignment, live/snapshot, errors, presentation, i18n/a11y
- Scoped commands: <REQUIRED> exact commands
- Repository gates: `pnpm format:check`, `pnpm lint:check`, `pnpm types:check`,
  `pnpm test:ct`, `pnpm test:e2e`, `git diff --check`

## Constraints

- Non-goals: <REQUIRED> intentionally excluded work
- Assumptions with evidence: <REQUIRED> list
- Open decisions: <REQUIRED> decisions and owner, or explicit none
- STOP conditions: <REQUIRED> ambiguity or architecture changes requiring approval
- Done criteria: <REQUIRED> observable completion checklist
```

## Verification matrix and done checklist

Apply cases where the specification says the state exists; mark a case not applicable with a reason
rather than silently omitting it.

| Area                | Required cases                                                                                      | Evidence                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| settings            | absent, valid current, supported legacy, malformed                                                  | normalizer tests and create/edit round trip                          |
| alignment           | one query, multiple queries, repeated corpus, missing positional mapping, missing positional result | transformation/component tests prove labels and indexes do not shift |
| live mode           | loading, success, per-query error, all-error                                                        | component or E2E test with observable request/result state           |
| supplied mode       | success, `null`, missing index, empty response, empty array                                         | component test proves no request and stable output                   |
| configuration       | valid mapping, missing mapping, invalid mapping/raw value                                           | localized notice and valid sibling behavior                          |
| presentation        | interactive detail, non-interactive published/embed, header off, source table off                   | role-based component assertions                                      |
| language and access | English, German, no missing keys, labelled controls/groups/alerts                                   | locale render and accessible-name queries                            |
| responsive          | 320 CSS-pixel viewport and representative wide viewport                                             | no component overflow; controls remain operable                      |
| publication         | live/cache identity to captured settings/mapping/data to published and embedded output              | publication round-trip integration evidence                          |

Before declaring done:

- [ ] The registry and semantic dependencies are explicit.
- [ ] Public props, defaults, emits, and positional invariants are documented and typed.
- [ ] Settings defaults/normalization work outside the component.
- [ ] Supplied data disables all live requests, including for empty/null entries.
- [ ] Live and supplied responses share the transformation path.
- [ ] Create, edit, detail, publication capture, published page, and embed are wired.
- [ ] English/German text, accessible names, and narrow/wide layouts are verified.
- [ ] Applicable rows in the verification matrix have evidence.
- [ ] Scoped tests and all repository gates have been run; baseline failures are recorded without
      weakening tests.
- [ ] The diff contains one visualization and no speculative shared base component.

## Anti-patterns and STOP rules

Do not:

- infer snapshot mode from `data.length`, truthiness, or the presence of non-null results;
- filter mappings/results before pairing them with queries;
- store defaults only in component-local refs or emit partial settings patches;
- let published rendering refetch live data or re-resolve current mappings;
- duplicate a usable generated NoSketch response type;
- hide request/configuration errors by returning an indistinguishable empty series;
- put deterministic domain parsing or aggregation into complex template expressions;
- hard-code untranslated labels or provide visual labels without accessible names;
- change the publication schema, metadata semantics, and component contract as incidental work;
- create a universal component/composable from one implementation.

**STOP and ask the product or architecture owner** when:

- the visualization needs a metadata semantic not present in `CorpusMetadataSemantic`;
- the NoSketch response cannot be represented by an existing generated type;
- publication requires a snapshot schema/version change or cannot reproduce the live cache identity;
- positional alignment cannot be maintained across queries, mappings, settings, and results;
- a proposed abstraction has only one consumer or would force unlike temporal/categorical/spatial
  behavior into one API;
- product meaning, defaults, invalid/empty-state behavior, or German terminology is ambiguous;
- the live and published implementations disagree and no test or product requirement establishes
  which is authoritative;
- a required gate fails for a reason not proven to be a pre-existing baseline.

Do not invent a convention at a STOP condition. Record the evidence, the smallest decision needed,
and the affected files.

## Known follow-ups

Use this contract first for the media-source migration. Revise the documented protocol only where
that second implementation provides evidence. Then migrate media type, followed by regional/spatial
rendering, whose map-specific behavior should remain explicit.

Shared code extraction is intentionally deferred until duplication is proven in at least two
migrated consumers. Until then, the candidate convention is a common protocol and similarly shaped
props—not a base Vue component, universal settings type, or universal transformation composable.
