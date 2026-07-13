import { expect, test } from "@playwright/experimental-ct-vue";

import MediaSourceDistribution from "@/components/data-display/data-display-media-source.vue";
import MediaTypeDistribution from "@/components/data-display/data-display-media-type.vue";
import RegionalFrequencies from "@/components/data-display/data-display-regional-frequencies.vue";

const query: CorpusQuery = {
	id: 1,
	noske: "demo-noske",
	type: "wordrow",
	userInput: "example",
	finalQuery: "example",
	preparedQuery: "example",
	color: "#ef4444",
	showPicker: false,
	corpus: "demo-corpus",
	subCorpus: "",
	concordance_query: { queryselector: "wordrow", word: "example" },
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

const data = [
	{
		Blocks: [
			{
				Items: [
					{ Word: [{ n: "Wien" }], frq: 3, reltt: 0.3 },
					{ Word: [{ n: "Niederösterreich" }], frq: 7, reltt: 0.7 },
				],
			},
		],
	},
];

function props(overrides = {}) {
	return {
		queries: [query],
		data,
		...overrides,
	};
}

test.describe("categorical and regional visualization components", () => {
	test("renders media source controls as compact radio-like toolbar groups", async ({ mount }) => {
		const component = await mount(MediaSourceDistribution, { props: props() });

		await expect(component.getByRole("toolbar", { name: "Media source controls" })).toBeVisible();
		await expect(component.getByLabel("Chart mode")).toBeVisible();
		await expect(component.getByLabel("Frequency mode")).toBeVisible();
		await expect(component.getByRole("button", { name: "Stacked bar chart" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await expect(component.getByRole("button", { name: "Relative" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await component.getByRole("button", { name: "Separate bar chart" }).click();
		await expect(component.getByRole("button", { name: "Separate bar chart" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});

	test("honors media source embedded presentation flags", async ({ mount }) => {
		const component = await mount(MediaSourceDistribution, {
			props: props({ interactive: false, showHeader: false, showSourceData: false }),
		});

		await expect(component.getByText("Media sources", { exact: true })).toHaveCount(0);
		await expect(component.getByLabel("Chart mode")).toHaveCount(0);
		await expect(component.getByLabel("Frequency mode")).toHaveCount(0);
		await expect(component.getByRole("button", { name: "Query details" })).toBeVisible();
		await expect(component.getByRole("toolbar", { name: "Source data controls" })).toHaveCount(0);
	});

	test("renders media type toolbar and donut distribution from supplied data", async ({
		mount,
	}) => {
		const component = await mount(MediaTypeDistribution, { props: props() });

		await expect(component.getByRole("toolbar", { name: "Media type controls" })).toBeVisible();
		await expect(component.getByRole("button", { name: "Percentage bar chart" })).toBeVisible();
		await expect(component.getByText("Distribution of media types per query")).toBeVisible();
	});

	test("renders regional map and bar controls from supplied data", async ({ mount }) => {
		const component = await mount(RegionalFrequencies, { props: props() });

		await expect(component.getByRole("toolbar", { name: "Regional controls" })).toBeVisible();
		await expect(component.getByLabel("Map mode")).toBeVisible();
		await expect(component.getByLabel("Frequency mode")).toBeVisible();
		await expect(component.getByLabel("Bar chart mode")).toBeVisible();
		await expect(component.getByRole("button", { name: "Combined map chart" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await component.getByRole("button", { name: "Separate map charts" }).click();
		await expect(component.getByRole("button", { name: "Separate map charts" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
	});
});
