import { expect, test } from "@playwright/experimental-ct-vue";

import DataDisplaySourceTable from "@/components/data-display/data-display-source-table.vue";

function query(id: number, userInput: string): CorpusQuery {
	return {
		id,
		noske: "demo-noske",
		type: "wordrow",
		userInput,
		finalQuery: userInput,
		preparedQuery: userInput,
		color: "#ef4444",
		showPicker: false,
		corpus: "demo-corpus",
		subCorpus: "",
		concordance_query: { queryselector: "wordrow", word: userInput },
		KWICAttrsStructs: { attributes: [], structures: [] },
		KWICAdditionalViewHeaders: [],
		KWICAttrsStructsOptions: { attributes: [], structures: [] },
		facettingValues: {},
		SampleRatio: 100,
		loading: {
			yearlyFrequencies: false,
			wordFormFrequencies: false,
			regionalFrequencies: false,
			keywordInContext: false,
			mediaSources: false,
			collocations: false,
		},
	};
}

const firstQuery = query(1, "first");
const secondQuery = query(2, "second");

function props(overrides = {}) {
	return {
		queries: [firstQuery, secondQuery],
		datatype: "mediaSources" as const,
		loading: [false, false],
		data: [[], [{ source: "Radio", count: 7 }]],
		...overrides,
	};
}

test.describe("data display source table", () => {
	test("renders a later aligned dataset when the first query is empty", async ({ mount }) => {
		const component = await mount(DataDisplaySourceTable, { props: props() });

		await expect(component.getByText("No results.")).toBeVisible();
		await component.getByRole("tab", { name: "wordrow: second" }).click();

		await expect(component.getByRole("columnheader", { name: "source" })).toBeVisible();
		await expect(component.getByRole("columnheader", { name: "count" })).toBeVisible();
		await expect(component.getByRole("cell", { name: "Radio" })).toBeVisible();
		await expect(component.getByRole("cell", { name: "7" })).toBeVisible();
	});

	test("uses the selected query's row shape", async ({ mount }) => {
		const component = await mount(DataDisplaySourceTable, {
			props: props({ data: [[{ year: 2024 }], [{ region: "Vienna", frequency: 12 }]] }),
		});

		await expect(component.getByRole("columnheader", { name: "year" })).toBeVisible();
		await component.getByRole("tab", { name: "wordrow: second" }).click();

		await expect(component.getByRole("columnheader", { name: "region" })).toBeVisible();
		await expect(component.getByRole("columnheader", { name: "frequency" })).toBeVisible();
		await expect(component.getByRole("columnheader", { name: "year" })).toHaveCount(0);
	});

	test("normalizes the active tab as queries are removed, emptied, and repopulated", async ({
		mount,
	}) => {
		const component = await mount(DataDisplaySourceTable, { props: props() });

		await component.getByRole("tab", { name: "wordrow: second" }).click();
		await component.update({ props: props({ queries: [firstQuery], data: [[{ first: "row" }]] }) });
		await expect(component.getByRole("tab", { name: "wordrow: first" })).toHaveAttribute(
			"data-state",
			"active",
		);
		await expect(component.getByRole("cell", { name: "row" })).toBeVisible();

		await component.update({ props: props({ queries: [], loading: [], data: [] }) });
		await expect(component.getByRole("tab")).toHaveCount(0);

		await component.update({
			props: props({ queries: [secondQuery], loading: [false], data: [[{ restored: "yes" }]] }),
		});
		await expect(component.getByRole("tab", { name: "wordrow: second" })).toHaveAttribute(
			"data-state",
			"active",
		);
		await expect(component.getByRole("cell", { name: "yes" })).toBeVisible();
	});

	test("keeps a valid sibling usable while another query is loading", async ({ mount }) => {
		const component = await mount(DataDisplaySourceTable, {
			props: props({ loading: [true, false], data: [[], [{ available: "sibling row" }]] }),
		});

		await component.getByRole("tab", { name: "wordrow: second" }).click();

		await expect(component.getByRole("columnheader", { name: "available" })).toBeVisible();
		await expect(component.getByRole("cell", { name: "sibling row" })).toBeVisible();
	});
});
