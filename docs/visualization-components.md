# Visualization Components

## Temporal Metadata Frequency Distribution

`data-display-metadata-temporal-frequency-distribution` is the pilot interface for
visualizing NoSketch frequency query results against corpus temporal metadata.

The display component receives `CorpusQuery` objects, temporal settings, and a
query-aligned `metadataMappings` array.

```vue
<DataDisplayMetadataTemporalFrequencyDistribution
	:queries="corpusQueries"
	:settings="temporalSettings"
	:metadata-mappings="temporalMetadataMappings"
/>
```

The prop contract is intentionally positional:

```ts
interface TemporalMetadataFrequencyDistributionProps {
	queries?: Array<CorpusQuery>;
	settings?: Partial<TemporalFrequencyDistributionSettings>;
	metadataMappings?: Array<CorpusMetadataMappingResponse | null>;
}
```

`metadataMappings[index]` must contain the resolved temporal mapping for `queries[index]`.
If any selected query has `null` or `undefined` at the same index, the component renders a
read-only missing-mapping message and does not issue temporal `/search/freqml` requests. If
every query has a mapping, it executes one `/search/freqml` request per query and normalizes
returned metadata values into yearly buckets.

Example `CorpusQuery` input:

```json
[
	{
		"id": 0,
		"noske": "64f1a4c2e8f1a4c2e8f1a4c2",
		"type": "lemmarow",
		"userInput": "Demokratie",
		"finalQuery": "[lemma=\"Demokratie\"]",
		"preparedQuery": "aword,[lemma=\"Demokratie\"]",
		"color": "#2563eb",
		"showPicker": false,
		"corpus": "amc",
		"subCorpus": "",
		"concordance_query": {
			"queryselector": "lemmarow",
			"lemma": "Demokratie"
		},
		"KWICAttrsStructs": {
			"attributes": [],
			"structures": ["doc.id", "doc.datum", "doc.region", "doc.docsrc"]
		},
		"KWICAttrsStructsOptions": {
			"attributes": [],
			"structures": []
		},
		"KWICAdditionalViewHeaders": [],
		"facettingValues": {},
		"SampleRatio": 100,
		"loading": {
			"yearlyFrequencies": false,
			"wordFormFrequencies": false,
			"regionalFrequencies": false,
			"keywordInContext": false,
			"mediaSources": false,
			"collocations": false
		}
	}
]
```

Matching `metadataMappings` input:

```json
[
	{
		"_id": "65a2b5d3e8f1a4c2e8f1a4c2",
		"noske": "64f1a4c2e8f1a4c2e8f1a4c2",
		"corpus": "amc",
		"semantic": "temporal",
		"scope": "default",
		"owner": "650000000000000000000000",
		"attribute": "doc.year",
		"parser": { "mode": "year" },
		"valueMap": {},
		"label": "Temporal distribution",
		"description": "",
		"createdAt": "2026-05-01T10:00:00.000Z",
		"updatedAt": "2026-05-01T10:00:00.000Z"
	}
]
```

For two queries using the same corpus mapping, the mapping appears twice in
`metadataMappings`, once at each query index. The lookup layer may deduplicate requests, but
display components should consume aligned arrays.

Metadata mapping lookup is owned by page-level orchestration via
`useCorpusMetadataMappings`. That composable deduplicates lookup requests by
`semantic + noske + corpus`, returns editor-friendly lookup state, and returns
`mappingsForQueries` aligned to the `CorpusQuery` array for display components.

Typical detail-page data flow:

```ts
const { buildCorpusQuery } = useCorpusQueryBuilder();

const corpusQueries = computed(() =>
	selectedQueryItems.value.map((query, index) => buildCorpusQuery(query, index)),
);

const { mappingsForQueries: temporalMetadataMappings } = await useCorpusMetadataMappings(
	corpusQueries,
	"temporal",
);
```

The same `corpusQueries` array is passed to the display component and to mapping lookup.
This keeps query-to-mapping alignment stable even when the lookup is deduplicated by
`semantic:noske:corpus`.

The visualization edit page renders `visualization-corpus-metadata-mapping-editor` next to
the visualization type selector for selected visualization types that declare editable
metadata semantics. The editor intentionally remains a bare JSON editor while the workflow
and endpoints stabilize.

Use `getVisualizationMetadataSemantics` and `getEditableVisualizationMetadataSemantics` to
derive metadata dependencies from visualization types instead of hardcoding component names
in pages. Currently only the temporal semantic is editable, but this boundary is intended
to support later spatial or media metadata refactors.

## Corpus Metadata Mappings

Corpus metadata mappings are keyed by NoSketch instance, corpus name, semantic, scope, and
owner:

- `semantic` is currently `temporal`.
- `scope: "default"` is the shared mapping for a corpus on a NoSketch instance.
- `scope: "user"` is a private user override.
- The current user's private mapping wins over the default mapping.
- If no mapping exists, temporal visualizations block instead of guessing an attribute.

Default mappings can be created or edited by the NoSketch instance owner and Corpsum admins.
Any authenticated user can save a private copy for their own work.

Mapping saves are independent from visualization saves. Saving a mapping writes to
`/api/corpus-metadata-mappings`; saving a visualization writes to `/api/visualization/:id`.
The mapping editor refreshes its own lookup state after a save and emits `updated` so parent
views can refresh resolved mapping data without coupling the two persistence flows.

The editor JSON is the editable subset of `CorpusMetadataMappingResponse`. It excludes
server-controlled fields such as `_id`, `noske`, `corpus`, `semantic`, `scope`, `owner`,
`createdAt`, and `updatedAt`; those are supplied by the selected query and save target.

Temporal editor JSON:

```json
{
	"attribute": "doc.year",
	"parser": { "mode": "year" },
	"valueMap": {
		"XX. session of the chamber": "1920"
	},
	"label": "Temporal distribution",
	"description": ""
}
```

Parser modes:

- `year`: the mapped or raw value must be a numeric year.
- `date`: the mapped or raw value must be parseable as a date; the UTC year is used.
- `regex`: `pattern` must capture the year in group 1 or a named `year` group.

Regex parser examples:

```json
{ "mode": "regex", "pattern": "session-(\\d{4})" }
```

```json
{ "mode": "regex", "pattern": "session-(?<year>\\d{4})" }
```

`valueMap` is applied before parsing, so corpus-specific labels can be mapped to parseable
year or date strings.

## Settings

Temporal visualization settings are persisted with the visualization:

```json
{
	"type": "data-display-metadata-temporal-frequency-distribution",
	"mode": "relative",
	"yearRange": { "start": 1986, "end": 2024 },
	"intervalSize": 2,
	"reverseIntervals": false,
	"sourceTableExpanded": false
}
```

Published visualizations snapshot both settings and the resolved corpus metadata mapping
used at publish time. Later edits to defaults or private mappings do not change published
output.
