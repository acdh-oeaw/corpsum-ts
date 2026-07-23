import { expect, test } from "@playwright/experimental-ct-vue";
import type { Locator, Page } from "@playwright/test";

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

const repeatedRegionalQueries: Array<CorpusQuery> = [
	{
		...query,
		id: 101,
		noske: "shared-noske",
		userInput: "repeated query",
		finalQuery: "repeated query",
		preparedQuery: "repeated query",
		color: "#b91c1c",
		corpus: "shared-corpus",
		concordance_query: { queryselector: "wordrow", word: "repeated query" },
		facettingValues: { region: ["east"] },
	},
	{
		...query,
		id: 202,
		noske: "shared-noske",
		userInput: "repeated query",
		finalQuery: "repeated query",
		preparedQuery: "repeated query",
		color: "#1d4ed8",
		corpus: "shared-corpus",
		concordance_query: { queryselector: "wordrow", word: "repeated query" },
		facettingValues: { region: ["west"] },
	},
];

function regionalResponse(region: string, absolute: number, relative: number) {
	return {
		Blocks: [{ Items: [{ Word: [{ n: region }], frq: absolute, reltt: relative }] }],
	};
}

const suppliedRegionalResponses = [
	regionalResponse("AT-1", 101, 0.101),
	regionalResponse("AT-2", 202, 0.202),
];

function parsedRegionalFrequencies(
	queries: Array<CorpusQuery>,
	responses: Array<ReturnType<typeof regionalResponse>>,
) {
	return queries.map((currentQuery, index) => ({
		query: currentQuery.id,
		data:
			responses[index]?.Blocks[0]?.Items.map((item) => ({
				region: item.Word[0]?.n ?? "",
				absolute: item.frq,
				relative: item.reltt,
			})) ?? [],
	}));
}

async function expectRegionalConsumers(
	component: Locator,
	queries: Array<CorpusQuery>,
	responses: Array<ReturnType<typeof regionalResponse>>,
) {
	const parsed = parsedRegionalFrequencies(queries, responses);
	await expect(component.getByTestId("combined-map-chart")).toHaveAttribute(
		"data-query-colors",
		JSON.stringify(queries.map((currentQuery) => currentQuery.color)),
	);
	await expect(component.getByTestId("combined-map-chart")).toHaveAttribute(
		"data-regional-frequencies",
		JSON.stringify(parsed),
	);
	await expect(component.getByTestId("chart")).toHaveAttribute(
		"data-series",
		JSON.stringify(
			queries.map((currentQuery, index) => ({
				color: currentQuery.color,
				name: `${currentQuery.type}: ${currentQuery.userInput} (${currentQuery.corpus})`,
				data: parsed[index]?.data.map((item) => [item.region, item.relative]) ?? [],
			})),
		),
	);
	await expect(component.getByTestId("source-table")).toHaveAttribute(
		"data-source-data",
		JSON.stringify(parsed.map((entry) => entry.data)),
	);
	await expect(component.getByTestId("source-table")).toHaveAttribute(
		"data-queries",
		JSON.stringify(queries),
	);
	await expect(component.getByTestId("source-table")).toHaveAttribute(
		"data-loading",
		JSON.stringify(queries.map(() => false)),
	);

	const queryDisplays = component.getByTestId("query-display");
	await expect(queryDisplays).toHaveCount(queries.length);
	for (const [index, currentQuery] of queries.entries()) {
		await expect(queryDisplays.nth(index)).toHaveAttribute(
			"data-query",
			JSON.stringify(currentQuery),
		);
		await expect(queryDisplays.nth(index)).toHaveAttribute("data-loading", "false");
	}
}

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

	test("keeps every regional consumer aligned through supplied-data query changes", async ({
		mount,
	}) => {
		const [queryA, queryB] = repeatedRegionalQueries;
		const [responseA, responseB] = suppliedRegionalResponses;
		expect(queryA).toBeDefined();
		expect(queryB).toBeDefined();
		expect(responseA).toBeDefined();
		expect(responseB).toBeDefined();

		const component = await mount(RegionalFrequencies, {
			props: { queries: [queryA, queryB], data: [responseA, responseB] },
		});
		await component.getByRole("button", { name: "Show data" }).click();
		await component.getByRole("button", { name: "Query details" }).click();
		await expectRegionalConsumers(component, [queryA, queryB], [responseA, responseB]);

		await component.update({
			props: { queries: [queryB, queryA], data: [responseB, responseA] },
		});
		await expectRegionalConsumers(component, [queryB, queryA], [responseB, responseA]);

		await component.update({ props: { queries: [queryA], data: [responseA] } });
		await expectRegionalConsumers(component, [queryA], [responseA]);

		await component.update({
			props: { queries: [queryA, queryB], data: [responseA, responseB] },
		});
		await expectRegionalConsumers(component, [queryA, queryB], [responseA, responseB]);

		const replacementResponses = [
			regionalResponse("AT-3", 303, 0.303),
			regionalResponse("AT-4", 404, 0.404),
		];
		await component.update({ props: { data: replacementResponses } });
		await expectRegionalConsumers(component, [queryA, queryB], replacementResponses);

		await component.getByRole("button", { name: "Separate map charts" }).click();
		const mapCharts = component.getByTestId("map-chart");
		await expect(mapCharts).toHaveCount(2);
		for (const [index, currentQuery] of [queryA, queryB].entries()) {
			await expect(mapCharts.nth(index)).toHaveAttribute(
				"data-query",
				JSON.stringify(currentQuery),
			);
			await expect(mapCharts.nth(index)).toHaveAttribute(
				"data-regional-frequency",
				JSON.stringify(
					parsedRegionalFrequencies([queryA, queryB], replacementResponses)[index]?.data,
				),
			);
		}
	});

	test("keeps live regional identities when repeated-corpus requests resolve in reverse", async ({
		mount,
		page,
	}) => {
		const releases = new Map<string, () => void>();
		const completionOrder: Array<string> = [];
		const liveResponses = {
			east: regionalResponse("AT-1", 101, 0.101),
			west: regionalResponse("AT-2", 202, 0.202),
		};

		await page.route("**/api/noske/**", async (route) => {
			const url = new URL(route.request().url());
			const requestBody = JSON.parse(url.searchParams.get("json") ?? "{}");
			const region = requestBody.concordance_query?.sca_region?.[0] as keyof typeof liveResponses;
			await new Promise<void>((resolve) => releases.set(region, resolve));
			await route.fulfill({ json: liveResponses[region] });
			completionOrder.push(region);
		});

		const component = await mount(RegionalFrequencies, {
			props: { queries: repeatedRegionalQueries },
		});
		await expect.poll(() => releases.size).toBe(2);
		releases.get("west")?.();
		await expect.poll(() => completionOrder).toStrictEqual(["west"]);
		releases.get("east")?.();
		await expect.poll(() => completionOrder).toStrictEqual(["west", "east"]);

		await expect(component.getByTestId("combined-map-chart")).toHaveAttribute(
			"data-query-colors",
			JSON.stringify(repeatedRegionalQueries.map((currentQuery) => currentQuery.color)),
		);
		await expect(component.getByTestId("combined-map-chart")).toHaveAttribute(
			"data-regional-frequencies",
			JSON.stringify(
				parsedRegionalFrequencies(repeatedRegionalQueries, [
					liveResponses.east,
					liveResponses.west,
				]),
			),
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
