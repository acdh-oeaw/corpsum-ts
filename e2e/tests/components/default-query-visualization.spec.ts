import { expect, test } from "@playwright/experimental-ct-vue";

import { getDefaultVisualizationPreset } from "@/lib/default-visualization-presets";
import {
	cloneQueryExecution,
	getQueryExecutionFingerprint,
	queryExecutionMatches,
} from "@/lib/query-execution";
import { temporalFrequencyDistributionType } from "@/lib/visualization-types";

const execution = {
	name: "Example",
	noske: "noske-a",
	corpus: "amc_4.2",
	subCorpus: "",
	type: "wordrow" as const,
	userInput: "example",
	facettingValues: { region: ["east"] },
};

test.describe("default query visualization", () => {
	test("selects ordered AMC and generic presets", () => {
		const amc = getDefaultVisualizationPreset("AMC_4.2");
		expect(amc.types).toStrictEqual([
			temporalFrequencyDistributionType,
			"data-display-word-form-frequencies",
			"data-display-keyword-in-context",
			"data-display-media-source",
			"data-display-media-type",
			"data-display-regional-frequencies",
			"data-display-collocations",
		]);
		expect(amc.settings[temporalFrequencyDistributionType]).toMatchObject({ rangeMode: "auto" });
		expect(getDefaultVisualizationPreset("other").types).toStrictEqual([
			"data-display-word-form-frequencies",
			"data-display-keyword-in-context",
		]);
	});

	test("creates a detached execution and a stable semantic fingerprint", () => {
		const copied = cloneQueryExecution(execution);
		copied.facettingValues = { region: ["west"] };
		expect(execution.facettingValues).toStrictEqual({ region: ["east"] });
		expect(queryExecutionMatches(execution, { ...execution, name: "Renamed" })).toBe(true);
		expect(queryExecutionMatches(execution, copied)).toBe(false);
		expect(
			getQueryExecutionFingerprint({
				...execution,
				facettingValues: { second: ["b"], first: ["a"] },
			}),
		).toBe(
			getQueryExecutionFingerprint({
				...execution,
				facettingValues: { first: ["a"], second: ["b"] },
			}),
		);
	});
});
