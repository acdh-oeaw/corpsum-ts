import { expect, test } from "@playwright/experimental-ct-vue";
import type { Page } from "@playwright/test";

import MediaSourceDistribution from "@/components/data-display/data-display-media-source.vue";
import MediaTypeDistribution from "@/components/data-display/data-display-media-type.vue";
import RegionalFrequencies from "@/components/data-display/data-display-regional-frequencies.vue";
import PublishedVisualizationRenderer from "@/components/published/published-visualization-renderer.vue";
import {
	defaultMediaSourceVisualizationSettings,
	defaultMediaTypeVisualizationSettings,
	defaultRegionalVisualizationSettings,
	createVisualizationSettingsState,
	getDefaultVisualizationSettings,
	getVisualizationSettingsForType,
	normalizeMediaSourceVisualizationSettings,
	normalizeMediaTypeVisualizationSettings,
	normalizeRegionalVisualizationSettings,
	normalizeVisualizationSettings,
	serializeVisualizationSettingsState,
	type MediaSourceVisualizationSettings,
	type MediaTypeVisualizationSettings,
	type RegionalVisualizationSettings,
} from "@/lib/visualization-types";

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

const mixedQueries: Array<CorpusQuery> = [
	{
		...query,
		id: 11,
		noske: "noske-a",
		userInput: "alpha",
		finalQuery: "alpha",
		preparedQuery: "alpha",
		color: "#dc2626",
		corpus: "corpus-a",
		subCorpus: "subcorpus-a",
		concordance_query: { queryselector: "wordrow", word: "alpha" },
		facettingValues: { region: ["east"] },
	},
	{
		...query,
		id: 22,
		noske: "noske-b",
		userInput: "beta",
		finalQuery: "beta",
		preparedQuery: "beta",
		color: "#2563eb",
		corpus: "corpus-b",
		subCorpus: "subcorpus-b",
		concordance_query: { queryselector: "wordrow", word: "beta" },
		facettingValues: { region: ["west"] },
	},
];

const mixedResponses = {
	"noske-a": {
		Blocks: [{ Items: [{ Word: [{ n: "AT-1" }], frq: 11, reltt: 0.11 }] }],
	},
	"noske-b": {
		Blocks: [{ Items: [{ Word: [{ n: "AT-2" }], frq: 22, reltt: 0.22 }] }],
	},
};

interface RecordedRequest {
	url: string;
	queryKey: Array<unknown>;
}

async function routeMixedInstanceResponses(page: Page) {
	const requests: Array<RecordedRequest> = [];
	await page.route("**/api/noske/**", async (route) => {
		const request = route.request();
		const noske = new URL(request.url()).pathname.split("/")[3] as keyof typeof mixedResponses;
		requests.push({
			url: request.url(),
			queryKey: JSON.parse(request.headers()["x-corpsum-client-query-key"] ?? "[]"),
		});
		await route.fulfill({ json: mixedResponses[noske] });
	});
	return requests;
}

function expectMixedInstanceIdentity(
	requests: Array<RecordedRequest>,
	attribute: "doc.docsrc" | "doc.mediatype" | "doc.region",
) {
	expect(requests).toHaveLength(2);
	const requestsByNoske = Object.fromEntries(
		requests.map((request) => [new URL(request.url).pathname.split("/")[3], request]),
	);
	const requestA = requestsByNoske["noske-a"];
	const requestB = requestsByNoske["noske-b"];
	expect(requestA).toBeDefined();
	expect(requestB).toBeDefined();

	for (const [request, noske, corpus, subcorpus, facet] of [
		[requestA, "noske-a", "corpus-a", "subcorpus-a", "east"],
		[requestB, "noske-b", "corpus-b", "subcorpus-b", "west"],
	] as const) {
		const url = new URL(request.url);
		expect(url.pathname).toBe(`/api/noske/${noske}/search/freqml`);
		expect(url.searchParams.get("corpname")).toBe(corpus);
		expect(url.searchParams.get("usesubcorp")).toBe(subcorpus);
		expect(url.searchParams.get("group")).toBe("0");
		expect(url.searchParams.get("showpoc")).toBe("1");
		expect(url.searchParams.get("showreltt")).toBe("1");
		expect(url.searchParams.get("showrel")).toBe("1");
		expect(url.searchParams.get("freqlevel")).toBe("1");
		expect(url.searchParams.get("ml1attr")).toBe(attribute);
		expect(url.searchParams.get("ml1ctx")).toBe("0~0 > 0");
		expect(JSON.parse(url.searchParams.get("json") ?? "{}")).toMatchObject({
			concordance_query: { sca_region: [facet] },
		});
		expect(request.queryKey[1]).toBe(noske);
		expect(request.queryKey[2]).toBe(corpus);
	}
	expect(requestA.queryKey).not.toStrictEqual(requestB.queryKey);

	const expectsPaging = attribute !== "doc.region";
	expect(new URL(requestA.url).searchParams.get("fmaxitems")).toBe(expectsPaging ? "5000" : null);
	expect(new URL(requestA.url).searchParams.get("fpage")).toBe(expectsPaging ? "1" : null);
}

function props(overrides = {}) {
	return {
		queries: [query],
		data,
		...overrides,
	};
}

test.describe("categorical and regional visualization components", () => {
	test("emits complete media source settings after persisted controls change", async ({
		mount,
	}) => {
		const updates: Array<MediaSourceVisualizationSettings> = [];
		const component = await mount(MediaSourceDistribution, {
			props: props(),
			on: {
				"update:settings": (settings: MediaSourceVisualizationSettings) => updates.push(settings),
			},
		});

		await component.getByRole("button", { name: "Absolute" }).click();
		await component.getByRole("button", { name: "Percentage bar chart" }).click();
		await component.getByRole("button", { name: "Show data" }).click();

		expect(updates.at(-1)).toStrictEqual({
			type: "data-display-media-source",
			mode: "absolute",
			chartMode: "percent",
			sourceTableExpanded: true,
		});
	});

	test("emits complete media type settings after persisted controls change", async ({ mount }) => {
		const updates: Array<MediaTypeVisualizationSettings> = [];
		const component = await mount(MediaTypeDistribution, {
			props: props(),
			on: {
				"update:settings": (settings: MediaTypeVisualizationSettings) => updates.push(settings),
			},
		});

		await component.getByRole("button", { name: "Absolute" }).click();
		await component.getByRole("button", { name: "Separate bar chart" }).click();
		await component.getByRole("button", { name: "Show data" }).click();

		expect(updates.at(-1)).toStrictEqual({
			type: "data-display-media-type",
			mode: "absolute",
			chartMode: "bar",
			sourceTableExpanded: true,
		});
	});

	test("emits complete regional settings after persisted controls change", async ({ mount }) => {
		const updates: Array<RegionalVisualizationSettings> = [];
		const component = await mount(RegionalFrequencies, {
			props: props(),
			on: {
				"update:settings": (settings: RegionalVisualizationSettings) => updates.push(settings),
			},
		});

		await component.getByRole("button", { name: "Separate map charts" }).click();
		await component.getByRole("button", { name: "Absolute" }).click();
		await component.getByRole("button", { name: "Stacked bar chart" }).click();
		await component.getByRole("button", { name: "Show data" }).click();

		expect(updates.at(-1)).toStrictEqual({
			type: "data-display-regional-frequencies",
			mode: "absolute",
			mapMode: "separate",
			barChartMode: "stack",
			sourceTableExpanded: true,
		});
	});

	test("synchronizes incoming settings without emitting equivalent updates", async ({ mount }) => {
		const updates: Array<MediaSourceVisualizationSettings> = [];
		const component = await mount(MediaSourceDistribution, {
			props: props({
				settings: {
					mode: "absolute",
					chartMode: "bar",
					sourceTableExpanded: true,
				},
			}),
			on: {
				"update:settings": (settings: MediaSourceVisualizationSettings) => updates.push(settings),
			},
		});

		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-mode",
			"absolute",
		);
		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-chart-mode",
			"bar",
		);
		await expect(component.getByRole("button", { name: "Hide data" })).toBeVisible();
		expect(updates).toStrictEqual([]);

		await component.update({
			props: props({
				settings: {
					mode: "relative",
					chartMode: "percent",
					sourceTableExpanded: false,
				},
			}),
		});
		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-mode",
			"relative",
		);
		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-chart-mode",
			"percent",
		);
		await expect(component.getByRole("button", { name: "Show data" })).toBeVisible();
		expect(updates).toStrictEqual([]);
	});

	test("routes media source queries and cache keys through their own instances", async ({
		mount,
		page,
	}) => {
		const requests = await routeMixedInstanceResponses(page);
		const component = await mount(MediaSourceDistribution, { props: { queries: mixedQueries } });

		await expect.poll(() => requests.length).toBe(2);
		expectMixedInstanceIdentity(requests, "doc.docsrc");
		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-query-colors",
			JSON.stringify(["#dc2626", "#2563eb"]),
		);
		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-source-distributions",
			JSON.stringify([
				[{ absolute: 11, relative: 0.11, media: "AT-1" }],
				[{ absolute: 22, relative: 0.22, media: "AT-2" }],
			]),
		);
	});

	test("routes media type queries and cache keys through their own instances", async ({
		mount,
		page,
	}) => {
		const requests = await routeMixedInstanceResponses(page);
		const component = await mount(MediaTypeDistribution, { props: { queries: mixedQueries } });

		await expect.poll(() => requests.length).toBe(2);
		expectMixedInstanceIdentity(requests, "doc.mediatype");
		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-query-colors",
			JSON.stringify(["#dc2626", "#2563eb"]),
		);
		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-source-distributions",
			JSON.stringify([
				[{ absolute: 11, relative: 0.11, media: "AT-1" }],
				[{ absolute: 22, relative: 0.22, media: "AT-2" }],
			]),
		);
	});

	test("routes regional queries and cache keys through their own instances", async ({
		mount,
		page,
	}) => {
		const requests = await routeMixedInstanceResponses(page);
		const component = await mount(RegionalFrequencies, { props: { queries: mixedQueries } });

		await expect.poll(() => requests.length).toBe(2);
		expectMixedInstanceIdentity(requests, "doc.region");
		await expect(component.getByTestId("combined-map-chart")).toHaveAttribute(
			"data-query-colors",
			JSON.stringify(["#dc2626", "#2563eb"]),
		);
		await expect(component.getByTestId("combined-map-chart")).toHaveAttribute(
			"data-regional-frequencies",
			JSON.stringify([
				{ query: 11, data: [{ region: "AT-1", absolute: 11, relative: 0.11 }] },
				{ query: 22, data: [{ region: "AT-2", absolute: 22, relative: 0.22 }] },
			]),
		);
	});

	test("does not issue live requests for defined supplied data", async ({ mount, page }) => {
		const requests: Array<string> = [];
		await page.route("**/api/noske/**", async (route) => {
			requests.push(route.request().url());
			await route.fulfill({ json: mixedResponses["noske-a"] });
		});

		await mount(MediaSourceDistribution, { props: { queries: mixedQueries, data: [] } });
		await mount(MediaTypeDistribution, {
			props: { queries: mixedQueries, data: [null, undefined] },
		});
		await mount(RegionalFrequencies, {
			props: { queries: mixedQueries, data: new Array(2) },
		});

		expect(requests).toHaveLength(0);
	});

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

test.describe("categorical and regional visualization settings", () => {
	test("normalizes absent, partial, malformed, and extra-field settings without mutation", () => {
		expect(normalizeMediaSourceVisualizationSettings(undefined)).toStrictEqual(
			defaultMediaSourceVisualizationSettings,
		);
		expect(normalizeMediaTypeVisualizationSettings(null)).toStrictEqual(
			defaultMediaTypeVisualizationSettings,
		);
		expect(normalizeRegionalVisualizationSettings("invalid")).toStrictEqual(
			defaultRegionalVisualizationSettings,
		);

		const mediaSourceInput = {
			mode: "absolute",
			chartMode: "invalid",
			sourceTableExpanded: true,
			extra: "discarded",
		};
		const mediaSourceCopy = structuredClone(mediaSourceInput);
		expect(normalizeMediaSourceVisualizationSettings(mediaSourceInput)).toStrictEqual({
			type: "data-display-media-source",
			mode: "absolute",
			chartMode: "stack",
			sourceTableExpanded: true,
		});
		expect(mediaSourceInput).toStrictEqual(mediaSourceCopy);

		expect(
			normalizeMediaTypeVisualizationSettings({ chartMode: "percent", unknown: true }),
		).toStrictEqual({
			type: "data-display-media-type",
			mode: "relative",
			chartMode: "percent",
			sourceTableExpanded: false,
		});
		expect(
			normalizeRegionalVisualizationSettings({
				mode: "absolute",
				mapMode: "separate",
				barChartMode: "percent",
				sourceTableExpanded: true,
				extra: true,
			}),
		).toStrictEqual({
			type: "data-display-regional-frequencies",
			mode: "absolute",
			mapMode: "separate",
			barChartMode: "percent",
			sourceTableExpanded: true,
		});
	});

	test("keeps the exhaustive shared dispatch type-owned and index-aligned", () => {
		const types = [
			"data-display-regional-frequencies",
			"data-display-media-source",
			"data-display-keyword-in-context",
			"data-display-media-type",
		] as const;
		const stored = [
			{ mapMode: "separate", barChartMode: "percent" },
			{ mode: "absolute", chartMode: "bar" },
			{ legacy: "ignored" },
			{ chartMode: "percent", sourceTableExpanded: true },
		];
		const normalized = types.map((type, index) =>
			normalizeVisualizationSettings(type, stored[index]),
		);

		expect(normalized.map((settings) => settings.type ?? null)).toStrictEqual([
			"data-display-regional-frequencies",
			"data-display-media-source",
			null,
			"data-display-media-type",
		]);
		expect(normalized[0]).toMatchObject({ mapMode: "separate", barChartMode: "percent" });
		expect(normalized[1]).toMatchObject({ mode: "absolute", chartMode: "bar" });
		expect(normalized[2]).toStrictEqual({});
		expect(normalized[3]).toMatchObject({ chartMode: "percent", sourceTableExpanded: true });
		expect(getDefaultVisualizationSettings("data-display-media-source")).not.toBe(
			getDefaultVisualizationSettings("data-display-media-source"),
		);
	});

	test("round-trips loaded settings through save, reorder, removal, and reload", () => {
		const loadedTypes = [
			"data-display-media-source",
			"data-display-regional-frequencies",
			"data-display-media-type",
		] as const;
		const loadedValues = [
			{ mode: "absolute", chartMode: "bar", sourceTableExpanded: true },
			{ mode: "absolute", mapMode: "separate", barChartMode: "percent" },
			{ chartMode: "percent" },
		];
		const state = createVisualizationSettingsState([...loadedTypes], loadedValues);
		const reorderedTypes = [
			"data-display-media-type",
			"data-display-media-source",
			"data-display-regional-frequencies",
		] as const;
		const saved = serializeVisualizationSettingsState([...reorderedTypes], state);

		expect(saved.map((settings) => settings.type)).toStrictEqual(reorderedTypes);
		expect(saved[0]).toMatchObject({ chartMode: "percent" });
		expect(saved[1]).toMatchObject({ mode: "absolute", chartMode: "bar" });
		expect(saved[2]).toMatchObject({ mapMode: "separate", barChartMode: "percent" });

		const afterRemoval = serializeVisualizationSettingsState(
			["data-display-media-type", "data-display-regional-frequencies"],
			state,
		);
		const reloadedState = createVisualizationSettingsState(
			["data-display-media-type", "data-display-regional-frequencies"],
			JSON.parse(JSON.stringify(afterRemoval)) as Array<unknown>,
		);
		expect(
			serializeVisualizationSettingsState(
				["data-display-media-type", "data-display-regional-frequencies"],
				reloadedState,
			),
		).toStrictEqual(afterRemoval);
	});

	test("captures normalized settings for the matching published visualization type", () => {
		const types = ["data-display-media-source", "data-display-regional-frequencies"] as const;
		const settings = [
			{ mode: "absolute", chartMode: "percent" },
			{ mapMode: "separate", barChartMode: "stack", sourceTableExpanded: true },
		];

		expect(
			getVisualizationSettingsForType([...types], settings, "data-display-regional-frequencies"),
		).toStrictEqual({
			type: "data-display-regional-frequencies",
			mode: "relative",
			mapMode: "separate",
			barChartMode: "stack",
			sourceTableExpanded: true,
		});
		expect(
			getVisualizationSettingsForType([...types], settings, "data-display-media-type"),
		).toStrictEqual(defaultMediaTypeVisualizationSettings);
	});

	test("reconstructs persisted settings in non-interactive published output", async ({ mount }) => {
		const component = await mount(PublishedVisualizationRenderer, {
			props: {
				embed: true,
				snapshot: {
					queries: [
						{
							...query,
							sourceQueryId: "query-1",
							KWICAttrsStructs: { attributes: [], structures: [] },
						},
					],
					visualizations: [
						"data-display-media-source",
						"data-display-media-type",
						"data-display-regional-frequencies",
					],
					panels: [
						{
							type: "data-display-media-source",
							queryId: "query-1",
							data: data[0],
							settings: { mode: "absolute", chartMode: "bar" },
						},
						{
							type: "data-display-media-type",
							queryId: "query-1",
							data: data[0],
							settings: { mode: "absolute", chartMode: "percent" },
						},
						{
							type: "data-display-regional-frequencies",
							queryId: "query-1",
							data: data[0],
							settings: {
								mode: "absolute",
								mapMode: "separate",
								barChartMode: "percent",
							},
						},
					],
				},
			},
		});

		const mediaCharts = component.getByTestId("media-stacked-bar-chart");
		await expect(mediaCharts).toHaveCount(2);
		await expect(mediaCharts.nth(0)).toHaveAttribute("data-mode", "absolute");
		await expect(mediaCharts.nth(0)).toHaveAttribute("data-chart-mode", "bar");
		await expect(mediaCharts.nth(1)).toHaveAttribute("data-mode", "absolute");
		await expect(mediaCharts.nth(1)).toHaveAttribute("data-chart-mode", "percent");
		const regionalSettings = await component
			.getByRole("toolbar", { name: "Regional controls" })
			.evaluate((toolbar) => {
				const card = toolbar.closest("[data-map-mode]");
				return {
					barChartMode: card?.getAttribute("data-bar-chart-mode"),
					frequencyMode: card?.getAttribute("data-frequency-mode"),
					mapMode: card?.getAttribute("data-map-mode"),
				};
			});
		expect(regionalSettings).toStrictEqual({
			barChartMode: "percent",
			frequencyMode: "absolute",
			mapMode: "separate",
		});
		await expect(component.getByLabel("Chart mode")).toHaveCount(0);
		await expect(component.getByLabel("Map mode")).toHaveCount(0);
	});
});
