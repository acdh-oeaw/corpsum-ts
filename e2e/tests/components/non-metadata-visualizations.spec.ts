import { expect, test } from "@playwright/experimental-ct-vue";
import type { Page } from "@playwright/test";

import Collocations from "@/components/data-display/data-display-collocations.vue";
import KeywordInContext from "@/components/data-display/data-display-keyword-in-context.vue";
import WordFormFrequencies from "@/components/data-display/data-display-word-form-frequencies.vue";
import PublishedVisualizationRenderer from "@/components/published/published-visualization-renderer.vue";
import {
	createKwicRequestOptionParams,
	getKwicAuthoritativeOptions,
	parseKwicQueryOptionsOverrides,
	resolveValidatedKwicQueryOptions,
} from "@/lib/kwic-query-options";
import type {
	CollocationVisualizationSettings,
	WordFormFrequencyVisualizationSettings,
} from "@/lib/visualization-types";
import {
	createVisualizationSettingsState,
	normalizeCollocationVisualizationSettings,
	normalizeWordFormFrequencyVisualizationSettings,
	serializeVisualizationSettingsState,
} from "@/lib/visualization-types";
import VisualizationDetailPage from "~/e2e/fixtures/visualization-detail-page.vue";

const queries: Array<CorpusQuery> = [
	{
		id: 11,
		noske: "noske-a",
		type: "wordrow",
		userInput: "alpha",
		finalQuery: "alpha",
		preparedQuery: "alpha",
		color: "#dc2626",
		showPicker: false,
		corpus: "corpus-a",
		subCorpus: "sub-a",
		concordance_query: { queryselector: "wordrow", word: "alpha" },
		KWICAttrsStructs: { attributes: [], structures: [] },
		KWICAttrsStructsOptions: { attributes: [], structures: [] },
		KWICAdditionalViewHeaders: [],
		facettingValues: { region: ["east"] },
		SampleRatio: 100,
		loading: {
			yearlyFrequencies: false,
			wordFormFrequencies: false,
			regionalFrequencies: false,
			keywordInContext: false,
			mediaSources: false,
			collocations: false,
		},
	},
	{
		id: 22,
		noske: "noske-b",
		type: "lemmarow",
		userInput: "beta",
		finalQuery: "beta",
		preparedQuery: "beta",
		color: "#2563eb",
		showPicker: false,
		corpus: "corpus-b",
		subCorpus: "",
		concordance_query: { queryselector: "lemmarow", lemma: "beta" },
		KWICAttrsStructs: { attributes: [], structures: [] },
		KWICAttrsStructsOptions: { attributes: [], structures: [] },
		KWICAdditionalViewHeaders: [],
		facettingValues: { region: ["west"] },
		SampleRatio: 100,
		loading: {
			yearlyFrequencies: false,
			wordFormFrequencies: false,
			regionalFrequencies: false,
			keywordInContext: false,
			mediaSources: false,
			collocations: false,
		},
	},
];

const wordResponses = {
	"noske-a": {
		Blocks: [{ Items: [{ Word: [{ n: "Alpha" }], frq: 10, fpm: 1.5 }] }],
	},
	"noske-b": {
		Blocks: [{ Items: [{ Word: [{ n: "Beta" }], frq: 20, fpm: 2.5 }] }],
	},
};

const collocationResponses = {
	"noske-a": {
		Items: [
			{
				str: "Alpha collocate",
				freq: 30,
				coll_freq: 12,
				Stats: [
					{ n: "d", s: "4.5" },
					{ n: "m", s: "3.5" },
					{ n: "t", s: "2.5" },
				],
			},
		],
	},
	"noske-b": {
		Items: [{ str: "Beta collocate", freq: 40, coll_freq: 22, Stats: [] }],
	},
};

const concordanceResponses = {
	"noske-a": {
		Lines: [
			{
				Tbl_refs: ["doc-a", "2026-01-01", "east", "source-a"],
				Left: [{ strc: "left alpha" }],
				Kwic: [{ str: "Alpha hit" }],
				Right: [{ str: "right alpha" }],
				toknum: 101,
			},
		],
	},
	"noske-b": {
		Lines: [
			{
				Tbl_refs: ["doc-b", "2026-02-02", "west", "source-b"],
				Left: [{ strc: "left beta" }],
				Kwic: [{ str: "Beta hit" }],
				Right: [{ str: "right beta" }],
				toknum: 202,
			},
		],
	},
};

const corpusInfoResponse = {
	attributes: [
		{ name: "word", label: "Word" },
		{ name: "lemma", label: "Lemma" },
	],
	structs: ["doc.id", "doc.datum", "doc.region", "doc.docsrc", "doc.genre"],
};

const kwicQueries: Array<CorpusQuery> = queries.map((query) => ({
	...query,
	KWICAttrsStructs: {
		attributes: [],
		structures: ["doc.id", "doc.datum", "doc.region", "doc.docsrc"],
	},
	KWICAttrsStructsOptions: {
		attributes: [{ name: "lemma", label: "Lemma", dynamic: "", fromattr: "" }],
		structures: [{ name: "doc.genre", label: "Genre", attributes: [] }],
	},
}));

async function routeWordResponses(page: Page, failedNoskes: Array<string> = []) {
	const requests: Array<{ headers: Record<string, string>; url: string }> = [];
	await page.route("**/api/noske/**", async (route) => {
		const request = route.request();
		const noske = new URL(request.url()).pathname.split("/")[3] as keyof typeof wordResponses;
		requests.push({ headers: request.headers(), url: request.url() });
		if (failedNoskes.includes(noske)) {
			await route.fulfill({ status: 503, json: { error: "private upstream failure" } });
			return;
		}
		await route.fulfill({ json: wordResponses[noske] });
	});
	return requests;
}

async function routeCollocationResponses(page: Page, failedNoskes: Array<string> = []) {
	const requests: Array<{ headers: Record<string, string>; url: string }> = [];
	await page.route("**/api/noske/**", async (route) => {
		const request = route.request();
		const noske = new URL(request.url()).pathname.split(
			"/",
		)[3] as keyof typeof collocationResponses;
		requests.push({ headers: request.headers(), url: request.url() });
		if (failedNoskes.includes(noske)) {
			await route.fulfill({ status: 503, json: { error: "private collx failure" } });
			return;
		}
		await route.fulfill({ json: collocationResponses[noske] });
	});
	return requests;
}

async function routeConcordanceResponses(page: Page, failedNoskes: Array<string> = []) {
	const requests: Array<{ headers: Record<string, string>; url: string }> = [];
	await page.route("**/api/noske/**", async (route) => {
		const request = route.request();
		const noske = new URL(request.url()).pathname.split(
			"/",
		)[3] as keyof typeof concordanceResponses;
		requests.push({ headers: request.headers(), url: request.url() });
		if (failedNoskes.includes(noske)) {
			await route.fulfill({ status: 503, json: { error: "private concordance failure" } });
			return;
		}
		await route.fulfill({ json: concordanceResponses[noske] });
	});
	return requests;
}

test.describe("non-metadata visualization contracts", () => {
	test("routes word-form requests per query and keeps a partial failure aligned", async ({
		mount,
		page,
	}) => {
		const requests = await routeWordResponses(page, ["noske-b"]);
		const component = await mount(WordFormFrequencies, { props: { queries } });

		await expect.poll(() => requests.length).toBe(2);
		for (const [index, expected] of [
			[0, { noske: "noske-a", corpus: "corpus-a", subcorpus: "sub-a", facet: "east" }],
			[1, { noske: "noske-b", corpus: "corpus-b", subcorpus: null, facet: "west" }],
		] as const) {
			const request = requests[index];
			expect(request).toBeDefined();
			const url = new URL(request.url);
			expect(url.pathname).toBe(`/api/noske/${expected.noske}/search/freqml`);
			expect(url.searchParams.get("corpname")).toBe(expected.corpus);
			expect(url.searchParams.get("usesubcorp")).toBe(expected.subcorpus);
			expect(url.searchParams.get("ml1attr")).toBe("word");
			expect(url.searchParams.get("ml1ctx")).toBe("0<0~0>0");
			expect(JSON.parse(url.searchParams.get("json") ?? "{}")).toMatchObject({
				concordance_query: { sca_region: [expected.facet] },
			});
			const cacheKey = JSON.parse(request.headers["x-corpsum-client-query-key"] ?? "[]");
			expect(cacheKey[1]).toBe(expected.noske);
			expect(cacheKey[2]).toBe(expected.corpus);
		}

		await expect(component.getByRole("alert")).toHaveText(
			"Word-form frequency data for this query could not be loaded.",
		);
		await expect(component.getByRole("alert")).not.toContainText("private upstream");
		await expect(component.getByTestId("chart")).toHaveAttribute(
			"data-series",
			JSON.stringify([
				{
					color: "#dc2626",
					name: "wordrow: alpha (corpus-a / sub-a)",
					data: [["Alpha", 1.5]],
				},
				{ color: "#2563eb", name: "lemmarow: beta (corpus-b)", data: [] },
			]),
		);
	});

	test("uses defined sparse word-form snapshots without network fallback", async ({
		mount,
		page,
	}) => {
		const requests = await routeWordResponses(page);
		const data = [wordResponses["noske-a"], undefined];
		const component = await mount(WordFormFrequencies, {
			props: { queries, data, showHeader: false, showSourceData: false },
		});

		expect(requests).toHaveLength(0);
		await expect(component.getByText("Word-form frequencies", { exact: true })).toHaveCount(0);
		await expect(component.getByRole("alert")).toHaveCount(0);
		await expect(component.getByRole("toolbar", { name: "Source data controls" })).toHaveCount(0);
		await expect(component.getByTestId("chart")).toHaveAttribute(
			"data-series",
			JSON.stringify([
				{
					color: "#dc2626",
					name: "wordrow: alpha (corpus-a / sub-a)",
					data: [["Alpha", 1.5]],
				},
				{ color: "#2563eb", name: "lemmarow: beta (corpus-b)", data: [] },
			]),
		);
		await component.update({ props: { data: [] } });
		await expect(component.getByTestId("chart")).toHaveAttribute(
			"data-series",
			JSON.stringify([
				{ color: "#dc2626", name: "wordrow: alpha (corpus-a / sub-a)", data: [] },
				{ color: "#2563eb", name: "lemmarow: beta (corpus-b)", data: [] },
			]),
		);
		await component.update({ props: { data: [null, null] } });
		expect(requests).toHaveLength(0);
	});

	test("emits complete word-form settings and synchronizes persisted input", async ({ mount }) => {
		const updates: Array<WordFormFrequencyVisualizationSettings> = [];
		const component = await mount(WordFormFrequencies, {
			props: {
				queries: [queries[0]!],
				data: [wordResponses["noske-a"]],
				settings: { mode: "relative", sourceTableExpanded: false },
			},
			on: {
				"update:settings": (settings: WordFormFrequencyVisualizationSettings) =>
					updates.push(settings),
			},
		});

		await component.getByRole("button", { name: "Absolute" }).click();
		await component.getByRole("button", { name: "Show data" }).click();
		expect(updates.at(-1)).toStrictEqual({
			type: "data-display-word-form-frequencies",
			mode: "absolute",
			sourceTableExpanded: true,
		});
		await expect(component.getByTestId("chart")).toHaveAttribute(
			"data-series",
			JSON.stringify([
				{
					color: "#dc2626",
					name: "wordrow: alpha (corpus-a / sub-a)",
					data: [["Alpha", 10]],
				},
			]),
		);

		const updateCount = updates.length;
		await component.update({
			props: { settings: { mode: "relative", sourceTableExpanded: false } },
		});
		await expect(component.getByRole("button", { name: "Relative" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(updates).toHaveLength(updateCount);
	});

	test("renders German word-form errors and keeps controls within 320 pixels", async ({
		mount,
		page,
	}) => {
		await page.setViewportSize({ width: 320, height: 800 });
		await routeWordResponses(page, ["noske-a"]);
		const component = await mount(WordFormFrequencies, {
			props: { queries: [queries[0]!] },
			hooksConfig: { locale: "de" },
		});

		await expect(component.getByRole("alert")).toHaveText(
			"Die Wortformenfrequenzdaten für diese Abfrage konnten nicht geladen werden.",
		);
		const box = await component
			.getByRole("toolbar", { name: "Steuerung der Wortformenfrequenzen" })
			.boundingBox();
		expect(box?.width).toBeLessThanOrEqual(320);
	});

	test("reconstructs word-form snapshots and settings through the published component", async ({
		mount,
	}) => {
		const component = await mount(PublishedVisualizationRenderer, {
			props: {
				embed: true,
				snapshot: {
					queries: queries.map((query, index) => ({
						...query,
						sourceQueryId: `query-${index}`,
					})),
					visualizations: ["data-display-word-form-frequencies"],
					panels: queries.map((_, index) => ({
						type: "data-display-word-form-frequencies",
						queryId: `query-${index}`,
						data: index === 0 ? wordResponses["noske-a"] : null,
						settings: { mode: "absolute", sourceTableExpanded: true },
					})),
				},
			},
		});

		await expect(component.getByRole("button", { name: "Absolute" })).toHaveCount(0);
		await expect(component.getByText("Word-form frequencies", { exact: true })).toHaveCount(0);
		await expect(component.getByTestId("chart")).toHaveAttribute(
			"data-series",
			JSON.stringify([
				{
					color: "#dc2626",
					name: "wordrow: alpha (corpus-a / sub-a)",
					data: [["Alpha", 10]],
				},
				{ color: "#2563eb", name: "lemmarow: beta (corpus-b)", data: [] },
			]),
		);
	});

	test("routes collocation requests per query and keeps a partial failure aligned", async ({
		mount,
		page,
	}) => {
		const requests = await routeCollocationResponses(page, ["noske-b"]);
		const component = await mount(Collocations, { props: { queries } });

		await expect.poll(() => requests.length).toBe(2);
		for (const [index, expected] of [
			[0, { noske: "noske-a", corpus: "corpus-a", subcorpus: "sub-a", facet: "east" }],
			[1, { noske: "noske-b", corpus: "corpus-b", subcorpus: null, facet: "west" }],
		] as const) {
			const request = requests[index];
			expect(request).toBeDefined();
			const url = new URL(request.url);
			expect(url.pathname).toBe(`/api/noske/${expected.noske}/search/collx`);
			expect(url.searchParams.get("corpname")).toBe(expected.corpus);
			expect(url.searchParams.get("usesubcorp")).toBe(expected.subcorpus);
			expect(url.searchParams.get("cattr")).toBe("lemma");
			expect(url.searchParams.get("ctow")).toBe("3");
			expect(url.searchParams.get("cminfreq")).toBe("9");
			expect(url.searchParams.get("cminbgr")).toBe("9");
			expect(url.searchParams.get("cbgrfns")).toBe("dmt");
			expect(url.searchParams.get("csortfn")).toBe("d");
			expect(url.searchParams.get("citemsperpage")).toBe("10");
			expect(JSON.parse(url.searchParams.get("json") ?? "{}")).toMatchObject({
				concordance_query: { sca_region: [expected.facet] },
			});
			const cacheKey = JSON.parse(request.headers["x-corpsum-client-query-key"] ?? "[]");
			expect(cacheKey[1]).toBe(expected.noske);
			expect(cacheKey[2]).toBe(expected.corpus);
			expect(cacheKey[4]).toMatchObject({ cattr: "lemma", citemsperpage: 10 });
		}

		await expect(component.getByRole("alert")).toHaveText(
			"Collocation data for this query could not be loaded.",
		);
		await expect(component.getByRole("alert")).not.toContainText("private collx");
		const clouds = component.getByTestId("word-cloud");
		await expect(clouds).toHaveCount(2);
		await expect(clouds.nth(0)).toHaveAttribute(
			"data-words",
			JSON.stringify([
				{
					word: "Alpha collocate",
					freq: 30,
					coll_freq: 12,
					d: 4.5,
					m: 3.5,
					t: 2.5,
					name: "Alpha collocate",
					weight: 12,
					color: "#dc2626",
				},
			]),
		);
		await expect(clouds.nth(1)).toHaveAttribute("data-words", "[]");
	});

	test("uses defined collocation snapshots without network fallback", async ({ mount, page }) => {
		const requests = await routeCollocationResponses(page);
		const component = await mount(Collocations, {
			props: {
				queries,
				data: [collocationResponses["noske-a"], undefined],
				showHeader: false,
				showSourceData: false,
			},
		});

		expect(requests).toHaveLength(0);
		await expect(component.getByText("Collocations", { exact: true })).toHaveCount(0);
		await expect(component.getByRole("alert")).toHaveCount(0);
		await expect(component.getByRole("toolbar", { name: "Source data controls" })).toHaveCount(0);
		await expect(component.getByTestId("word-cloud")).toHaveCount(2);
		await component.update({ props: { data: [] } });
		await expect(component.getByTestId("word-cloud").nth(0)).toHaveAttribute("data-words", "[]");
		await component.update({ props: { data: [null, null] } });
		expect(requests).toHaveLength(0);
	});

	test("changes collocation cache identity with cattr and emits complete settings", async ({
		mount,
		page,
	}) => {
		const requests = await routeCollocationResponses(page);
		const updates: Array<CollocationVisualizationSettings> = [];
		const component = await mount(Collocations, {
			props: { queries: [queries[0]!] },
			on: {
				"update:settings": (settings: CollocationVisualizationSettings) => updates.push(settings),
			},
		});

		await expect.poll(() => requests.length).toBe(1);
		await component.getByRole("button", { name: "Frequency", exact: true }).click();
		await component.getByRole("combobox").click();
		await page.getByRole("option", { name: "word", exact: true }).click();
		await expect.poll(() => requests.length).toBe(2);
		const secondUrl = new URL(requests[1]!.url);
		expect(secondUrl.searchParams.get("cattr")).toBe("word");
		const secondKey = JSON.parse(requests[1]!.headers["x-corpsum-client-query-key"] ?? "[]");
		expect(secondKey[4]).toMatchObject({ cattr: "word" });
		await component.getByRole("button", { name: "Show data" }).click();
		expect(updates.at(-1)).toStrictEqual({
			type: "data-display-collocations",
			mode: "freq",
			cattr: "word",
			sourceTableExpanded: true,
		});
		await expect(component.getByTestId("word-cloud")).toHaveAttribute(
			"data-words",
			JSON.stringify([
				{
					word: "Alpha collocate",
					freq: 30,
					coll_freq: 12,
					d: 4.5,
					m: 3.5,
					t: 2.5,
					name: "Alpha collocate",
					weight: 30,
					color: "#dc2626",
				},
			]),
		);
		await expect(component.getByTestId("word-cloud")).toHaveAttribute(
			"data-title",
			"Frequency for alpha",
		);
		await expect(
			component.getByText("Explore words that frequently occur near each query."),
		).toBeVisible();
	});

	test("renders German collocation errors in a wrapping 320-pixel toolbar", async ({
		mount,
		page,
	}) => {
		await page.setViewportSize({ width: 320, height: 800 });
		await routeCollocationResponses(page, ["noske-a"]);
		const component = await mount(Collocations, {
			props: { queries: [queries[0]!] },
			hooksConfig: { locale: "de" },
		});

		await expect(component.getByRole("alert")).toHaveText(
			"Die Kollokationsdaten für diese Abfrage konnten nicht geladen werden.",
		);
		await expect(
			component.getByText("Zeigt Wörter, die häufig im Umfeld der Abfrage vorkommen."),
		).toBeVisible();
		await expect(component.getByTestId("word-cloud")).toHaveAttribute(
			"data-title",
			"Kollokationsfrequenz für alpha",
		);
		const box = await component
			.getByRole("toolbar", { name: "Steuerung der Kollokationen" })
			.boundingBox();
		expect(box?.width).toBeLessThanOrEqual(320);
	});

	test("reconstructs collocation snapshots and settings through the published component", async ({
		mount,
	}) => {
		const component = await mount(PublishedVisualizationRenderer, {
			props: {
				embed: true,
				snapshot: {
					queries: queries.map((query, index) => ({
						...query,
						sourceQueryId: `query-${index}`,
					})),
					visualizations: ["data-display-collocations"],
					panels: queries.map((_, index) => ({
						type: "data-display-collocations",
						queryId: `query-${index}`,
						data: index === 0 ? collocationResponses["noske-a"] : null,
						settings: { mode: "freq", cattr: "word", sourceTableExpanded: true },
					})),
				},
			},
		});

		await expect(component.getByRole("button", { name: "Frequency", exact: true })).toHaveCount(0);
		await expect(component.getByRole("combobox")).toHaveCount(0);
		await expect(component.getByTestId("word-cloud").nth(0)).toHaveAttribute(
			"data-words",
			JSON.stringify([
				{
					word: "Alpha collocate",
					freq: 30,
					coll_freq: 12,
					d: 4.5,
					m: 3.5,
					t: 2.5,
					name: "Alpha collocate",
					weight: 30,
					color: "#dc2626",
				},
			]),
		);
	});

	test("routes concordance requests per query and keeps a partial failure aligned", async ({
		mount,
		page,
	}) => {
		const requests = await routeConcordanceResponses(page, ["noske-b"]);
		const component = await mount(KeywordInContext, { props: { queries: kwicQueries } });

		await expect.poll(() => requests.length).toBe(2);
		for (const [index, expected] of [
			[0, { noske: "noske-a", corpus: "corpus-a", subcorpus: "sub-a", facet: "east" }],
			[1, { noske: "noske-b", corpus: "corpus-b", subcorpus: null, facet: "west" }],
		] as const) {
			const request = requests[index];
			expect(request).toBeDefined();
			const url = new URL(request.url);
			expect(url.pathname).toBe(`/api/noske/${expected.noske}/search/concordance`);
			expect(url.searchParams.get("corpname")).toBe(expected.corpus);
			expect(url.searchParams.get("usesubcorp")).toBe(expected.subcorpus);
			expect(url.searchParams.get("viewmode")).toBe("kwic");
			expect(url.searchParams.get("attrs")).toBe("");
			expect(url.searchParams.get("structs")).toBe("doc.id,doc.datum,doc.region,doc.docsrc");
			expect(url.searchParams.get("refs")).toBe("=doc.id,=doc.datum,=doc.region,=doc.docsrc");
			expect(url.searchParams.get("pagesize")).toBe("1000");
			expect(url.searchParams.get("format")).toBe("json");
			expect(JSON.parse(url.searchParams.get("json") ?? "{}")).toMatchObject({
				concordance_query: { sca_region: [expected.facet] },
			});
			const cacheKey = JSON.parse(request.headers["x-corpsum-client-query-key"] ?? "[]");
			expect(cacheKey[1]).toBe(expected.noske);
			expect(cacheKey[2]).toBe(expected.corpus);
			expect(cacheKey[4]).toMatchObject({
				attrs: "",
				structs: "doc.id,doc.datum,doc.region,doc.docsrc",
				pagesize: 1000,
			});
		}

		await expect(component.getByRole("alert")).toHaveText(
			"Keyword-in-context data for this query could not be loaded.",
		);
		await expect(component.getByRole("alert")).not.toContainText("private concordance");
		await expect(component.getByText("Alpha hit", { exact: true })).toBeVisible();
		await expect(component.getByText("Beta hit", { exact: true })).toHaveCount(0);
	});

	test("uses defined sparse concordance snapshots without network fallback", async ({
		mount,
		page,
	}) => {
		const requests = await routeConcordanceResponses(page);
		const component = await mount(KeywordInContext, {
			props: {
				queries: kwicQueries,
				data: [concordanceResponses["noske-a"], undefined],
				interactive: false,
				showHeader: false,
			},
		});

		expect(requests).toHaveLength(0);
		await expect(component.getByText("Keyword in context", { exact: true })).toHaveCount(0);
		await expect(component.getByRole("checkbox", { name: "View options" })).toHaveCount(0);
		await expect(component.getByRole("alert")).toHaveCount(0);
		await expect(component.getByText("Alpha hit", { exact: true })).toBeVisible();
		await expect(component.getByText("No results.")).toBeVisible();
		await component.update({ props: { data: [] } });
		await expect(component.getByText("No results.")).toHaveCount(2);
		await component.update({ props: { data: [null, null] } });
		expect(requests).toHaveLength(0);
	});

	test("includes live-selected KWIC attributes and structures in cache identity", async ({
		mount,
		page,
	}) => {
		const requests = await routeConcordanceResponses(page);
		const initialQuery = {
			...kwicQueries[0]!,
			KWICAttrsStructs: {
				attributes: [...kwicQueries[0]!.KWICAttrsStructs.attributes],
				structures: [...kwicQueries[0]!.KWICAttrsStructs.structures],
			},
		};
		const component = await mount(KeywordInContext, {
			props: { queries: [initialQuery] },
		});

		await expect.poll(() => requests.length).toBe(1);
		await component.update({
			props: {
				queries: [
					{
						...initialQuery,
						KWICAttrsStructs: {
							attributes: ["lemma"],
							structures: [...initialQuery.KWICAttrsStructs.structures, "doc.genre"],
						},
					},
				],
			},
		});
		await expect.poll(() => requests.length).toBeGreaterThanOrEqual(2);

		const finalRequest = requests.at(-1);
		expect(finalRequest).toBeDefined();
		const url = new URL(finalRequest.url);
		expect(url.searchParams.get("attrs")).toBe("lemma");
		expect(url.searchParams.get("structs")).toBe(
			"doc.id,doc.datum,doc.region,doc.docsrc,doc.genre",
		);
		expect(url.searchParams.get("refs")).toBe(
			"=doc.id,=doc.datum,=doc.region,=doc.docsrc,=doc.genre",
		);
		const cacheKey = JSON.parse(finalRequest.headers["x-corpsum-client-query-key"] ?? "[]");
		expect(cacheKey[4]).toMatchObject({
			attrs: "lemma",
			structs: "doc.id,doc.datum,doc.region,doc.docsrc,doc.genre",
			refs: "=doc.id,=doc.datum,=doc.region,=doc.docsrc,=doc.genre",
		});
	});

	test("uses stable unique KWIC view-option controls for two queries", async ({ mount }) => {
		const component = await mount(KeywordInContext, {
			props: { queries: kwicQueries, data: [null, null] },
		});
		const controls = component.getByRole("checkbox", { name: "View options" });
		await expect(controls).toHaveCount(2);
		await expect(controls.nth(0)).toHaveAttribute("id", "kwic-view-options-11");
		await expect(controls.nth(1)).toHaveAttribute("id", "kwic-view-options-22");
		const labels = component.getByText("View options", { exact: true });
		await expect(labels).toHaveCount(2);
		await labels.nth(0).click();
		await expect(controls.nth(0)).toHaveAttribute("aria-checked", "true");
		await expect(controls.nth(1)).toHaveAttribute("aria-checked", "false");
		await expect(component.getByRole("checkbox", { name: "lemma" })).toHaveCount(1);
	});

	test("rejects invalid keyed KWIC publication payloads before cache lookup", () => {
		const allowed = new Set(["query-a", "query-b"]);
		expect(parseKwicQueryOptionsOverrides(undefined, allowed)).toStrictEqual({});
		expect(
			parseKwicQueryOptionsOverrides(
				{
					"query-a": {
						attributes: ["lemma"],
						structures: ["doc.id", "doc.datum", "doc.region", "doc.docsrc", "doc.genre"],
					},
				},
				allowed,
			),
		).toStrictEqual({
			"query-a": {
				attributes: ["lemma"],
				structures: ["doc.id", "doc.datum", "doc.region", "doc.docsrc", "doc.genre"],
			},
		});
		expect(
			parseKwicQueryOptionsOverrides({ unknown: { attributes: [], structures: [] } }, allowed),
		).toBeNull();
		expect(
			parseKwicQueryOptionsOverrides(
				{ "query-a": { attributes: "lemma", structures: [] } },
				allowed,
			),
		).toBeNull();
		expect(
			parseKwicQueryOptionsOverrides(
				{ "query-a": { attributes: [], structures: [], extra: true } },
				allowed,
			),
		).toBeNull();
		for (const invalid of [
			{ attributes: ["lemma", "lemma"], structures: corpusInfoResponse.structs },
			{ attributes: ["lemma,bad"], structures: corpusInfoResponse.structs },
			{ attributes: ["lemma=bad"], structures: corpusInfoResponse.structs },
			{ attributes: [], structures: ["doc.datum", "doc.id", "doc.region", "doc.docsrc"] },
			{ attributes: [], structures: ["doc.id", "doc.datum", "doc.region"] },
		]) {
			expect(parseKwicQueryOptionsOverrides({ "query-a": invalid }, allowed)).toBeNull();
		}

		const authoritative = getKwicAuthoritativeOptions(corpusInfoResponse);
		expect(
			resolveValidatedKwicQueryOptions({
				overrides: {
					"query-a": {
						attributes: ["lemma"],
						structures: [...corpusInfoResponse.structs],
					},
				},
				queryIds: ["query-a", "query-b"],
				authoritativeByQueryId: { "query-a": authoritative, "query-b": authoritative },
			}),
		).toStrictEqual({
			"query-a": { attributes: ["lemma"], structures: corpusInfoResponse.structs },
			"query-b": {
				attributes: [],
				structures: ["doc.id", "doc.datum", "doc.region", "doc.docsrc"],
			},
		});
		for (const invalid of [
			{ attributes: ["unoffered"], structures: corpusInfoResponse.structs },
			{
				attributes: [],
				structures: [...corpusInfoResponse.structs, "doc.unoffered"],
			},
		]) {
			expect(
				resolveValidatedKwicQueryOptions({
					overrides: { "query-a": invalid },
					queryIds: ["query-a"],
					authoritativeByQueryId: { "query-a": authoritative },
				}),
			).toBeNull();
		}
	});

	test("hydrates page KWIC choices before exact cache warm and publication", async ({
		mount,
		page,
	}) => {
		const concordanceRequests: Array<{ headers: Record<string, string>; url: string }> = [];
		await page.route("**/api/noske/noske-a/search/**", async (route) => {
			const request = route.request();
			if (new URL(request.url()).pathname.endsWith("/corp_info")) {
				await route.fulfill({ json: corpusInfoResponse });
				return;
			}
			concordanceRequests.push({ headers: request.headers(), url: request.url() });
			await route.fulfill({ json: concordanceResponses["noske-a"] });
		});

		const component = await mount(VisualizationDetailPage, {
			hooksConfig: {
				visualizationPage: {
					visualization: {
						_id: "visualization-a",
						name: "KWIC publication",
						queries: ["query-a"],
						visualizations: ["data-display-keyword-in-context"],
						settings: [{}],
						data: [],
					},
					queries: [
						{
							_id: "query-a",
							name: "Alpha query",
							owner: [],
							noske: "noske-a",
							corpus: "corpus-a",
							subCorpus: "sub-a",
							type: "wordrow",
							userInput: "alpha",
							facettingValues: { region: ["east"] },
							updatedAt: "2026-01-01T00:00:00.000Z",
						},
					],
				},
			},
		});
		await component
			.getByRole("checkbox", { name: "View options" })
			.evaluate((element: HTMLElement) => element.click());
		await expect(component.getByRole("checkbox", { name: "lemma" })).toHaveCount(1);
		await component
			.getByRole("checkbox", { name: "lemma" })
			.evaluate((element: HTMLElement) => element.click());
		await expect(component.getByRole("checkbox", { name: "lemma" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await component
			.getByRole("checkbox", { name: "doc.genre" })
			.evaluate((element: HTMLElement) => element.click());
		await expect(component.getByRole("checkbox", { name: "doc.genre" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await expect.poll(() => concordanceRequests.length).toBeGreaterThanOrEqual(2);

		const warmed = concordanceRequests.at(-1)!;
		const warmedUrl = new URL(warmed.url);
		const expectedOptions = {
			attributes: ["lemma"],
			structures: ["doc.id", "doc.datum", "doc.region", "doc.docsrc", "doc.genre"],
		};
		const expectedParams = createKwicRequestOptionParams(expectedOptions);
		expect(
			Object.fromEntries(
				Object.keys(expectedParams).map((key) => [key, warmedUrl.searchParams.get(key)]),
			),
		).toStrictEqual(expectedParams);
		const warmedKey = JSON.parse(warmed.headers["x-corpsum-client-query-key"] ?? "[]");
		expect(warmedKey[4]).toMatchObject(expectedParams);

		await component.getByRole("button", { name: "Publish", exact: true }).click();
		await page.getByRole("dialog").getByRole("button", { name: "Publish" }).click();
		const publishRequests = await page.evaluate(
			() =>
				(
					globalThis as typeof globalThis & {
						__componentTestPublishRequests: Array<{ options: { body: unknown } }>;
					}
				).__componentTestPublishRequests,
		);
		expect(publishRequests).toHaveLength(1);
		expect(publishRequests[0]?.options.body).toMatchObject({
			kwicQueryOptions: { "query-a": expectedOptions },
		});
	});

	test("normalizes and round-trips non-metadata settings through the type-owned codecs", () => {
		expect(
			normalizeWordFormFrequencyVisualizationSettings({
				mode: "absolute",
				sourceTableExpanded: true,
				extra: "ignored",
			}),
		).toStrictEqual({
			type: "data-display-word-form-frequencies",
			mode: "absolute",
			sourceTableExpanded: true,
		});
		expect(
			normalizeCollocationVisualizationSettings({
				mode: "invalid",
				cattr: "invalid",
				sourceTableExpanded: 1,
			}),
		).toStrictEqual({
			type: "data-display-collocations",
			mode: "coll_freq",
			cattr: "lemma",
			sourceTableExpanded: false,
		});

		const types = [
			"data-display-collocations",
			"data-display-keyword-in-context",
			"data-display-word-form-frequencies",
		] as const;
		const state = createVisualizationSettingsState(
			[...types],
			[
				{ mode: "freq", cattr: "word", sourceTableExpanded: true },
				{ transientPanelOpen: true },
				{ mode: "absolute", sourceTableExpanded: true },
			],
		);
		expect(serializeVisualizationSettingsState([...types], state)).toStrictEqual([
			{
				type: "data-display-collocations",
				mode: "freq",
				cattr: "word",
				sourceTableExpanded: true,
			},
			{},
			{
				type: "data-display-word-form-frequencies",
				mode: "absolute",
				sourceTableExpanded: true,
			},
		]);
	});

	test("renders localized KWIC errors and published snapshots through the shared table", async ({
		mount,
		page,
	}) => {
		await routeConcordanceResponses(page, ["noske-a"]);
		const live = await mount(KeywordInContext, {
			props: { queries: [kwicQueries[0]!] },
			hooksConfig: { locale: "de" },
		});
		await expect(live.getByRole("alert")).toHaveText(
			"Die Keyword-im-Kontext-Daten für diese Abfrage konnten nicht geladen werden.",
		);

		const snapshotQuery = {
			...kwicQueries[0]!,
			sourceQueryId: "query-a",
			KWICAttrsStructs: {
				attributes: ["lemma"],
				structures: ["doc.id", "doc.datum", "doc.region", "doc.docsrc", "doc.genre"],
			},
		};
		const published = await mount(PublishedVisualizationRenderer, {
			props: {
				embed: true,
				snapshot: {
					queries: [snapshotQuery],
					visualizations: ["data-display-keyword-in-context"],
					panels: [
						{
							type: "data-display-keyword-in-context",
							queryId: "query-a",
							data: concordanceResponses["noske-a"],
						},
					],
				},
			},
			hooksConfig: { locale: "de" },
		});

		await expect(published.getByRole("checkbox", { name: "Ansichtsoptionen" })).toHaveCount(0);
		await expect(published.getByRole("columnheader", { name: "Quelle" })).toBeVisible();
		await expect(published.getByRole("columnheader", { name: "Wort" })).toBeVisible();
		await expect(published.getByText("Alpha hit", { exact: true })).toBeVisible();
		await expect(published.getByTestId("query-display")).toHaveAttribute(
			"data-query",
			JSON.stringify({
				...snapshotQuery,
				concordance_query: snapshotQuery.concordance_query,
				facettingValues: snapshotQuery.facettingValues,
				showPicker: false,
				KWICAttrsStructsOptions: { attributes: [], structures: [] },
				KWICAdditionalViewHeaders: [],
				loading: snapshotQuery.loading,
			}),
		);
	});
});
