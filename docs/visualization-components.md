# Visualization Components

## Temporal Metadata Frequency Distribution

`data-display-metadata-temporal-frequency-distribution` is the pilot interface for
visualizing NoSketch frequency query results against corpus temporal metadata.

The component receives `CorpusQuery` objects and temporal settings. It resolves a temporal
metadata mapping for each query's `{ noske, corpus }` pair, executes one `/search/freqml`
request per query, and normalizes returned metadata values into yearly buckets.

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

Temporal mappings contain:

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

## Migration

Run `pnpm db:migrate` to apply database migrations. The first migration renames saved and
published `data-display-yearly-frequencies` records to
`data-display-metadata-temporal-frequency-distribution` and fills in the old yearly defaults.
