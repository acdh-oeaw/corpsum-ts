import { expect, test } from "@playwright/experimental-ct-vue";
import type { Page } from "@playwright/test";

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

async function routeMixedInstanceErrors(
	page: Page,
	failedNoskes: Array<keyof typeof mixedResponses>,
) {
	const requests: Array<string> = [];
	await page.route("**/api/noske/**", async (route) => {
		const request = route.request();
		const noske = new URL(request.url()).pathname.split("/")[3] as keyof typeof mixedResponses;
		requests.push(request.url());
		if (failedNoskes.includes(noske)) {
			await route.fulfill({
				status: 503,
				json: { error: "sensitive upstream failure detail" },
			});
			return;
		}
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

	test("keeps a successful media-source sibling visible beside an initial failure", async ({
		mount,
		page,
	}) => {
		const requests = await routeMixedInstanceErrors(page, ["noske-b"]);
		const component = await mount(MediaSourceDistribution, { props: { queries: mixedQueries } });

		await expect.poll(() => requests.length).toBe(2);
		await expect(component.getByRole("alert")).toHaveText(
			"Media source data for this query could not be loaded.",
		);
		await expect(component.getByRole("alert")).not.toContainText("sensitive upstream");
		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-source-distributions",
			JSON.stringify([[{ absolute: 11, relative: 0.11, media: "AT-1" }], []]),
		);
	});

	test("renders one accessible media-type notice for every failed query", async ({
		mount,
		page,
	}) => {
		await routeMixedInstanceErrors(page, ["noske-a", "noske-b"]);
		const component = await mount(MediaTypeDistribution, { props: { queries: mixedQueries } });

		await expect(component.getByRole("alert")).toHaveCount(2);
		await expect(component.getByRole("alert")).toHaveText([
			"Media type data for this query could not be loaded.",
			"Media type data for this query could not be loaded.",
		]);
	});

	test("identifies an initial regional-frequency failure", async ({ mount, page }) => {
		await routeMixedInstanceErrors(page, ["noske-a"]);
		const component = await mount(RegionalFrequencies, {
			props: { queries: [mixedQueries[0]!] },
		});

		await expect(component.getByRole("alert")).toHaveText(
			"Regional frequency data for this query could not be loaded.",
		);
	});

	test("retains media-source data and warns when a refresh fails", async ({ mount, page }) => {
		let requestCount = 0;
		await page.route("**/api/noske/**", async (route) => {
			requestCount += 1;
			if (requestCount === 1) {
				await route.fulfill({ json: mixedResponses["noske-a"] });
				return;
			}
			await route.fulfill({ status: 503, json: { error: "refresh failed" } });
		});
		const component = await mount(MediaSourceDistribution, {
			props: { queries: [mixedQueries[0]!] },
		});
		const expectedDistribution = JSON.stringify([
			[{ absolute: 11, relative: 0.11, media: "AT-1" }],
		]);

		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-source-distributions",
			expectedDistribution,
		);
		await page.evaluate(async () => {
			const queryClient = (
				globalThis as typeof globalThis & {
					__componentTestQueryClient: { invalidateQueries(): Promise<void> };
				}
			).__componentTestQueryClient;
			await queryClient.invalidateQueries();
		});
		await expect.poll(() => requestCount).toBe(2);
		await expect(component.getByRole("alert")).toHaveText(
			"Media source data for this query could not be refreshed. The displayed result may be out of date.",
		);
		await expect(component.getByTestId("media-stacked-bar-chart")).toHaveAttribute(
			"data-source-distributions",
			expectedDistribution,
		);
	});

	test("does not report successful empty responses as live errors", async ({ mount, page }) => {
		const requests: Array<string> = [];
		await page.route("**/api/noske/**", async (route) => {
			requests.push(route.request().url());
			await route.fulfill({ json: { Blocks: [{ Items: [] }] } });
		});
		const component = await mount(RegionalFrequencies, {
			props: { queries: [mixedQueries[0]!] },
		});

		await expect.poll(() => requests.length).toBe(1);
		await expect(component.getByRole("alert")).toHaveCount(0);
		await expect(component.getByTestId("combined-map-chart")).toHaveAttribute(
			"data-regional-frequencies",
			JSON.stringify([{ query: 11, data: [] }]),
		);
	});

	test("does not issue live requests for defined supplied data", async ({ mount, page }) => {
		const requests: Array<string> = [];
		await page.route("**/api/noske/**", async (route) => {
			requests.push(route.request().url());
			await route.fulfill({ json: mixedResponses["noske-a"] });
		});

		const mediaSource = await mount(MediaSourceDistribution, {
			props: { queries: mixedQueries, data: [] },
		});
		const mediaType = await mount(MediaTypeDistribution, {
			props: { queries: mixedQueries, data: [null, undefined] },
		});
		const regional = await mount(RegionalFrequencies, {
			props: { queries: mixedQueries, data: new Array(2) },
		});

		expect(requests).toHaveLength(0);
		await expect(mediaSource.getByRole("alert")).toHaveCount(0);
		await expect(mediaType.getByRole("alert")).toHaveCount(0);
		await expect(regional.getByRole("alert")).toHaveCount(0);
	});

	test("renders German live errors without missing message keys", async ({ mount, page }) => {
		const missingKeys: Array<string> = [];
		page.on("console", (message) => {
			if (message.type() === "warning" && message.text().includes("Not found")) {
				missingKeys.push(message.text());
			}
		});
		await routeMixedInstanceErrors(page, ["noske-a"]);

		const mediaSource = await mount(MediaSourceDistribution, {
			props: { queries: [mixedQueries[0]!] },
			hooksConfig: { locale: "de" },
		});
		await expect(mediaSource.getByRole("alert")).toHaveText(
			"Die Medienquellendaten für diese Abfrage konnten nicht geladen werden.",
		);
		await mediaSource.unmount();

		const mediaType = await mount(MediaTypeDistribution, {
			props: { queries: [mixedQueries[0]!] },
			hooksConfig: { locale: "de" },
		});
		await expect(mediaType.getByRole("alert")).toHaveText(
			"Die Medientypdaten für diese Abfrage konnten nicht geladen werden.",
		);
		await mediaType.unmount();

		const regional = await mount(RegionalFrequencies, {
			props: { queries: [mixedQueries[0]!] },
			hooksConfig: { locale: "de" },
		});
		await expect(regional.getByRole("alert")).toHaveText(
			"Die regionalen Frequenzdaten für diese Abfrage konnten nicht geladen werden.",
		);
		expect(missingKeys).toStrictEqual([]);
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
