import { expect, test } from "@playwright/experimental-ct-vue";

import QueryVisualizationPreview from "@/components/query/query-visualization-preview.vue";

const execution = {
	name: "Example query",
	noske: "noske-a",
	corpus: "generic-corpus",
	subCorpus: "",
	type: "wordrow" as const,
	userInput: "example",
	facettingValues: {},
};

test.describe("query visualization preview", () => {
	test("runs the generic preset without persistence and reuses a promoted query on retry", async ({
		mount,
		page,
	}) => {
		let queryCreates = 0;
		let visualizationCreates = 0;
		await page.route("**/api/noske/noske-a/search/corp_info?*", async (route) => {
			await route.fulfill({ json: { attributes: [{ name: "word" }], structs: ["text.id"] } });
		});
		await page.route("**/api/noske/noske-a/search/freqml?*", async (route) => {
			await route.fulfill({ json: { Blocks: [{ Items: [] }] } });
		});
		await page.route("**/api/noske/noske-a/search/concordance?*", async (route) => {
			await route.fulfill({ json: { Lines: [] } });
		});
		await page.route("**/api/query", async (route) => {
			queryCreates += 1;
			await route.fulfill({ json: { _id: "64b000000000000000000004" } });
		});
		await page.route("**/api/visualization", async (route) => {
			visualizationCreates += 1;
			await route.fulfill({ status: 500, json: { message: "try again" } });
		});

		const component = await mount(QueryVisualizationPreview, { props: { execution } });
		await expect(component.getByRole("heading", { name: "Query visualization" })).toBeVisible();
		await expect(component.getByText("Word form frequencies", { exact: true })).toBeVisible();
		await expect(component.getByText("Keyword in context", { exact: true })).toBeVisible();
		expect(queryCreates).toBe(0);
		expect(visualizationCreates).toBe(0);

		await component.getByRole("button", { name: "Save visualization" }).click();
		await page
			.getByRole("dialog", { name: "Save visualization" })
			.getByRole("button", {
				name: "Save visualization",
			})
			.click();
		await expect(page.getByRole("alert")).toContainText("try again");
		expect(queryCreates).toBe(1);
		expect(visualizationCreates).toBe(1);

		await page
			.getByRole("dialog", { name: "Save visualization" })
			.getByRole("button", {
				name: "Save visualization",
			})
			.click();
		await expect.poll(() => visualizationCreates).toBe(2);
		expect(queryCreates).toBe(1);
	});

	test("reuses an unchanged query owned by the current user", async ({ mount, page }) => {
		const sourceId = "64b000000000000000000005";
		const sourceQuery = {
			...execution,
			_id: sourceId,
			owner: [{ _id: "64b000000000000000000006", username: "alice" }],
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		};
		let queryCreates = 0;
		let visualizationBody: Record<string, unknown> | null = null;
		await page.route("**/api/noske/noske-a/search/corp_info?*", async (route) => {
			await route.fulfill({ json: { attributes: [{ name: "word" }], structs: ["text.id"] } });
		});
		await page.route("**/api/noske/noske-a/search/freqml?*", async (route) => {
			await route.fulfill({ json: { Blocks: [{ Items: [] }] } });
		});
		await page.route("**/api/noske/noske-a/search/concordance?*", async (route) => {
			await route.fulfill({ json: { Lines: [] } });
		});
		await page.route(`**/api/query/${sourceId}`, async (route) => {
			await route.fulfill({ json: sourceQuery });
		});
		await page.route("**/api/query", async (route) => {
			queryCreates += 1;
			await route.fulfill({ json: { _id: "64b000000000000000000007" } });
		});
		await page.route("**/api/visualization", async (route) => {
			visualizationBody = route.request().postDataJSON() as Record<string, unknown>;
			await route.fulfill({ status: 500, json: { message: "try again" } });
		});

		const component = await mount(QueryVisualizationPreview, {
			props: { execution, sourceQuery },
			hooksConfig: { authUser: { username: "alice" } },
		});
		await component.getByRole("button", { name: "Save visualization" }).click();
		await page
			.getByRole("dialog", { name: "Save visualization" })
			.getByRole("button", { name: "Save visualization" })
			.click();
		await expect(page.getByRole("alert")).toContainText("try again");
		expect(queryCreates).toBe(0);
		expect(visualizationBody).toMatchObject({
			queries: [sourceId],
			visualizations: ["data-display-word-form-frequencies", "data-display-keyword-in-context"],
		});
	});
});
