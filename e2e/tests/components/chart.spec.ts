// oxlint-disable playwright/no-raw-locators
import { expect, test } from "@playwright/experimental-ct-vue";
import { VisGroupedBarSelectors, VisLineSelectors, VisStackedBarSelectors } from "@unovis/vue";

import Chart from "@/components/chart.vue";

const series = [
	{
		label: "Articles",
		color: "#ef4444",
		data: [
			[2020, 12],
			[2021, 18],
			[2022, 24],
		] satisfies Array<[number, number]>,
	},
	{
		label: "Books",
		color: "#3b82f6",
		data: [
			[2020, 7],
			[2021, 11],
			[2022, 17],
		] satisfies Array<[number, number]>,
	},
];

test.describe("chart", () => {
	[
		{
			chartType: "line" as const,
			selector: VisLineSelectors.line,
			count: 2,
		},
		{
			chartType: "bar" as const,
			selector: VisGroupedBarSelectors.bar,
			count: 6,
		},
		{
			chartType: "stack" as const,
			selector: VisStackedBarSelectors.bar,
			count: 6,
		},
	].forEach((t) => {
		test(`renders a ${t.chartType} chart with legend and axis labels`, async ({ mount }) => {
			const component = await mount(Chart, {
				props: {
					series: [...series],
					chartType: t.chartType,
					title: "Publications over time",
					xAxis: "Year",
					yAxis: "Mentions",
					height: 320,
				},
			});

			await expect(component).toContainText("Publications over time");
			await expect(component).toContainText("Articles");
			await expect(component).toContainText("Books");
			await expect(component).toContainText("Year");
			await expect(component).toContainText("Mentions");
			await expect(component.locator("svg:not(.lucide)")).toBeVisible();
			await expect(component.locator(`.${t.selector}`)).toHaveCount(t.count);
		});
	});

	test("dims non-hovered series when a legend item is focused", async ({ mount }) => {
		const component = await mount(Chart, {
			props: {
				series: [...series],
				chartType: "line",
				height: 320,
			},
		});

		const lines = component.locator(`.${VisLineSelectors.line}`);

		await component.getByRole("button", { name: "Articles" }).focus();
		await expect
			.poll(async () => {
				return lines.evaluateAll((elements) =>
					elements.map((element) => getComputedStyle(element).opacity),
				);
			})
			.toStrictEqual(["1", "0.3"]);

		await component.getByRole("button", { name: "Articles" }).blur();
		await expect
			.poll(async () => {
				return lines.evaluateAll((elements) =>
					elements.map((element) => getComputedStyle(element).opacity),
				);
			})
			.toStrictEqual(["1", "1"]);
	});

	test("does not render chart controls when no series are provided", async ({ mount }) => {
		const component = await mount(Chart, {
			props: {
				series: [],
				chartType: "line",
			},
		});

		await expect(component.locator("svg")).toHaveCount(0);
		await expect(component.getByRole("button")).toHaveCount(0);
	});
});
