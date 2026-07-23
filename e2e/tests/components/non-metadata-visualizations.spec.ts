import { expect, test } from "@playwright/experimental-ct-vue";
import type { Page } from "@playwright/test";

import WordFormFrequencies from "@/components/data-display/data-display-word-form-frequencies.vue";
import PublishedVisualizationRenderer from "@/components/published/published-visualization-renderer.vue";
import type { WordFormFrequencyVisualizationSettings } from "@/lib/visualization-types";

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
});
