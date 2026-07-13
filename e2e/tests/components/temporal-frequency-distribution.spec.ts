import { expect, test } from "@playwright/experimental-ct-vue";

import {
	aggregateTemporalFrequencies,
	createTemporalFrequencyParser,
	formatTemporalFrequencyInterval,
	formatTemporalTimestamp,
	getAllowedTemporalBucketUnits,
	getAllowedTemporalBucketUnitsForMappings,
	groupTemporalFrequencyPoints,
} from "@/components/data-display/data-display-temporal-frequency-distribution.transformations.ts";
import TemporalFrequencyDistribution from "@/components/data-display/data-display-temporal-frequency-distribution.vue";
import {
	defaultTemporalFrequencyDistributionSettings,
	isTemporalBucketRangeSupported,
	normalizeTemporalFrequencyDistributionSettings,
	temporalFrequencyDistributionType,
} from "@/lib/visualization-types";
import { alignChartSeriesData, getChartTooltipDomainValue } from "@/utils/chart-data";

const utc = (value: string) => new Date(`${value}T00:00:00.000Z`);

const query: CorpusQuery = {
	id: 1,
	noske: "demo-noske",
	type: "word",
	userInput: "example",
	finalQuery: "example",
	preparedQuery: "example",
	color: "#ef4444",
	showPicker: false,
	corpus: "demo-corpus",
	subCorpus: "",
	concordance_query: { queryselector: "word", word: "example" },
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
const mapping = {
	_id: "mapping-1",
	createdAt: null,
	updatedAt: null,
	noske: "demo-noske",
	corpus: "demo-corpus",
	semantic: "temporal" as const,
	scope: "default" as const,
	attribute: "publication_date",
	parser: { mode: "date" as const, sourceUnit: "day" as const },
	valueMap: {},
};
const data = [{ Blocks: [{ Items: [{ Word: [{ n: "2020-01-02" }], frq: 3, reltt: 0.3 }] }] }];

function componentProps(overrides = {}) {
	return {
		queries: [query],
		metadataMappings: [mapping],
		data,
		settings: {
			bucketUnit: "month" as const,
			mode: "absolute" as const,
			dateRange: {
				start: "2020-01-01T00:00:00.000Z",
				end: "2020-04-01T00:00:00.000Z",
			},
		},
		...overrides,
	};
}

test.describe("temporal visualization component", () => {
	test("groups and names interactive controls", async ({ mount, page }) => {
		const component = await mount(TemporalFrequencyDistribution, { props: componentProps() });
		await expect(component.getByRole("heading", { name: "Time-series settings" })).toHaveCount(0);
		await expect(component.getByRole("heading", { name: "Interval chart settings" })).toHaveCount(
			0,
		);
		await expect(component.getByRole("toolbar", { name: "Time-series controls" })).toBeVisible();
		await expect(component.getByRole("toolbar", { name: "Query controls" })).toHaveCount(0);
		await expect(component.getByRole("button", { name: "Query details" })).toBeVisible();
		await expect(component.getByRole("button", { name: "Query details" })).toHaveAttribute(
			"title",
			"Show query details and cache controls.",
		);
		await component.getByRole("button", { name: "Query details" }).click();
		await expect(page.getByRole("dialog", { name: "Query details" })).toHaveAttribute(
			"data-state",
			"open",
		);
		await page.keyboard.press("Escape");
		await expect(component.getByRole("toolbar", { name: "Interval chart controls" })).toBeVisible();
		await expect(component.getByRole("toolbar", { name: "Source data controls" })).toBeVisible();
		await expect(component.getByRole("button", { name: "Absolute" })).toBeVisible();
		await expect(component.getByRole("button", { name: "Relative" })).toBeVisible();
		await expect(component.getByRole("button", { name: "Absolute" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		await expect(component.getByRole("button", { name: "Relative" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		await component.getByRole("button", { name: "Absolute" }).click();
		await expect(component.getByRole("button", { name: "Absolute" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		for (const label of [
			"Frequency mode",
			"Time unit",
			"Start date",
			"End date (exclusive)",
			"Interval size",
		]) {
			await expect(component.getByLabel(label)).toBeVisible();
		}
		await expect(component.getByLabel("Time unit")).toHaveAttribute(
			"title",
			"Choose the time unit used to bucket the time-series chart.",
		);
		await expect(component.getByLabel("Start date")).toHaveAttribute(
			"title",
			"Set the first date included in the temporal frequency range.",
		);
		await expect(component.getByLabel("End date (exclusive)")).toHaveAttribute(
			"title",
			"Set the exclusive end date for the temporal frequency range.",
		);
		await expect(component.getByLabel("Interval size")).toHaveAttribute(
			"title",
			"Choose how many selected time units are combined into each interval.",
		);
		await expect(
			component.getByRole("button", {
				name: "Start grouping at the end of the date range",
			}),
		).toBeEnabled();
		await expect(
			component.getByRole("button", {
				name: "Start grouping at the beginning of the date range",
			}),
		).toHaveAttribute("aria-pressed", "true");
		await expect(
			component.getByRole("button", {
				name: "Start grouping at the end of the date range",
			}),
		).toHaveAttribute("aria-pressed", "false");
		await component
			.getByRole("button", { name: "Start grouping at the beginning of the date range" })
			.click();
		await expect(
			component.getByRole("button", {
				name: "Start grouping at the beginning of the date range",
			}),
		).toHaveAttribute("aria-pressed", "true");
		await page.mouse.move(0, 0);
		await component
			.getByRole("button", { name: "Start grouping at the beginning of the date range" })
			.hover();
		await expect(
			page.getByText("Group intervals forward from the beginning of the selected date range."),
		).toBeVisible();
		await page.mouse.move(0, 0);
		await expect(
			page.getByText("Group intervals forward from the beginning of the selected date range."),
		).toHaveCount(0);
		await component
			.getByRole("button", { name: "Start grouping at the end of the date range" })
			.hover();
		await expect(
			page.getByText("Group intervals backward from the end of the selected date range."),
		).toBeVisible();
	});

	test("honors embedded presentation flags", async ({ mount }) => {
		const component = await mount(TemporalFrequencyDistribution, {
			props: componentProps({ interactive: false, showHeader: false, showSourceData: false }),
		});
		await expect(component.getByRole("heading", { name: "Time-series settings" })).toHaveCount(0);
		await expect(component.getByRole("toolbar", { name: "Query controls" })).toHaveCount(0);
		await expect(component.getByRole("toolbar", { name: "Time-series controls" })).toHaveCount(1);
		await expect(component.getByRole("button", { name: "Query details" })).toBeVisible();
		await expect(component.getByLabel("Frequency mode")).toHaveCount(0);
		await expect(component.getByRole("toolbar", { name: "Interval chart controls" })).toHaveCount(
			0,
		);
		await expect(component.getByRole("button", { name: "Show data" })).toHaveCount(0);
		await expect(component.getByText("Temporal frequencies", { exact: true })).toHaveCount(0);
	});

	test("hides source data controls in non-interactive source data mode", async ({ mount }) => {
		const props = componentProps();
		const component = await mount(TemporalFrequencyDistribution, {
			props: {
				...props,
				interactive: false,
				showHeader: false,
				showSourceData: true,
				settings: { ...props.settings, sourceTableExpanded: true },
			},
		});
		await expect(component.getByRole("toolbar", { name: "Query controls" })).toHaveCount(0);
		await expect(component.getByRole("button", { name: "Query details" })).toBeVisible();
		await expect(component.getByRole("toolbar", { name: "Source data controls" })).toHaveCount(0);
		await expect(component.getByRole("button", { name: "Show data" })).toHaveCount(0);
		await expect(component.getByRole("button", { name: "Hide data" })).toHaveCount(0);
	});

	test("shows localized invalid range and mapping notices", async ({ mount }) => {
		const component = await mount(TemporalFrequencyDistribution, { props: componentProps() });
		await component.getByLabel("Start date").fill("2020-04-01");
		await expect(component.getByRole("alert")).toHaveText(
			"The exclusive end date must be later than the start date.",
		);
		await component.unmount();

		const missing = await mount(TemporalFrequencyDistribution, {
			props: { queries: [query], data: [null], metadataMappings: [null] },
		});
		await expect(missing.getByText("Temporal metadata mapping required")).toBeVisible();
		await missing.unmount();

		const invalid = await mount(TemporalFrequencyDistribution, {
			props: componentProps({
				metadataMappings: [
					{ ...mapping, parser: { mode: "regex", sourceUnit: "day", pattern: "[" } },
				],
			}),
		});
		await expect(invalid.getByText("Invalid temporal metadata mapping")).toBeVisible();
	});

	test("renders German without missing message keys", async ({ mount, page }) => {
		const missingKeys: Array<string> = [];
		page.on("console", (message) => {
			if (message.type() === "warn" && message.text().includes("Not found")) {
				missingKeys.push(message.text());
			}
		});
		const component = await mount(TemporalFrequencyDistribution, {
			props: componentProps(),
			hooksConfig: { locale: "de" },
		});
		await expect(component.getByRole("heading", { name: "Zeitreiheneinstellungen" })).toHaveCount(
			0,
		);
		await expect(component.getByLabel("Zeiteinheit")).toBeVisible();
		await expect(component.getByRole("toolbar", { name: "Steuerung der Zeitreihe" })).toBeVisible();
		await expect(component.getByRole("toolbar", { name: "Abfragesteuerung" })).toHaveCount(0);
		await expect(component.getByRole("button", { name: "Abfragedetails" })).toBeVisible();
		await component.getByRole("button", { name: "Relativ" }).hover();
		await expect(page.getByText("Relative Frequenzen anzeigen.")).toBeVisible();
		expect(missingKeys).toStrictEqual([]);
	});

	test("does not overflow at a 320 CSS-pixel viewport", async ({ mount, page }) => {
		await page.setViewportSize({ width: 320, height: 800 });
		const component = await mount(TemporalFrequencyDistribution, { props: componentProps() });
		expect(await component.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
			true,
		);
	});

	test("emits complete normalized settings after control changes", async ({ mount, page }) => {
		const updates: Array<ReturnType<typeof normalizeTemporalFrequencyDistributionSettings>> = [];
		const component = await mount(TemporalFrequencyDistribution, {
			props: componentProps(),
			on: { "update:settings": (settings) => updates.push(settings) },
		});
		await component.getByRole("button", { name: "Relative" }).click();
		await component.getByLabel("Time unit").click();
		await page.getByRole("option", { name: "day", exact: true }).click();
		await component.getByLabel("Start date").fill("2020-01-02");
		await component.getByLabel("End date (exclusive)").fill("2020-05-01");
		await component.getByLabel("Interval size").click();
		await page.getByRole("option", { name: "5 days", exact: true }).click();
		await component
			.getByRole("button", { name: "Start grouping at the end of the date range" })
			.click();
		await component.getByRole("button", { name: "Show data" }).click();
		await expect.poll(() => updates.length).toBeGreaterThan(0);
		expect(updates.at(-1)).toMatchObject({
			type: temporalFrequencyDistributionType,
			mode: "relative",
			bucketUnit: "day",
			dateRange: {
				start: "2020-01-02T00:00:00.000Z",
				end: "2020-05-01T00:00:00.000Z",
			},
			intervalSize: 5,
			reverseIntervals: true,
			sourceTableExpanded: true,
		});
	});

	test("populates time units from mapping precision and selected range", async ({
		mount,
		page,
	}) => {
		const component = await mount(TemporalFrequencyDistribution, { props: componentProps() });
		await expect(component.getByLabel("Time unit")).toBeEnabled();
		await component.getByLabel("Time unit").click();
		for (const unit of ["day", "week", "month", "quarter", "year"]) {
			await expect(page.getByRole("option", { name: unit, exact: true })).toBeVisible();
		}
		await page.keyboard.press("Escape");
		await component.unmount();

		const yearPrecision = await mount(TemporalFrequencyDistribution, {
			props: componentProps({
				metadataMappings: [
					{ ...mapping, parser: { mode: "year" as const, sourceUnit: "year" as const } },
				],
				settings: {
					bucketUnit: "year" as const,
					dateRange: {
						start: "2020-01-01T00:00:00.000Z",
						end: "2024-01-01T00:00:00.000Z",
					},
				},
			}),
		});
		await expect(yearPrecision.getByLabel("Time unit")).toBeDisabled();
		await expect(yearPrecision.getByLabel("Time unit")).toHaveText("year");
		await expect(page.getByRole("option", { name: "day", exact: true })).toHaveCount(0);
	});
});

test.describe("temporal metadata parsing", () => {
	test("returns dates at the declared source precision", () => {
		const yearParser = createTemporalFrequencyParser({
			parser: { mode: "year", sourceUnit: "year" },
			valueMap: { unknown: "2020" },
		});
		const monthParser = createTemporalFrequencyParser({
			parser: { mode: "date", sourceUnit: "month" },
			valueMap: {},
		});
		const legacyDateParser = createTemporalFrequencyParser({
			parser: { mode: "date", sourceUnit: "year" },
			valueMap: {},
		});
		const quarterParser = createTemporalFrequencyParser({
			parser: { mode: "date", sourceUnit: "quarter" },
			valueMap: {},
		});
		const weekParser = createTemporalFrequencyParser({
			parser: { mode: "date", sourceUnit: "week" },
			valueMap: {},
		});

		expect(yearParser.parse("unknown")?.toISOString()).toBe("2020-01-01T00:00:00.000Z");
		expect(monthParser.parse("2020-05")?.toISOString()).toBe("2020-05-01T00:00:00.000Z");
		expect(legacyDateParser.parse("2020-05-12")?.toISOString()).toBe("2020-01-01T00:00:00.000Z");
		expect(quarterParser.parse("2020-Q3")?.toISOString()).toBe("2020-07-01T00:00:00.000Z");
		expect(weekParser.parse("2020-W02")?.toISOString()).toBe("2020-01-06T00:00:00.000Z");
		expect(yearParser.parse("")).toBeNull();
	});

	test("reports malformed regular expressions without throwing", () => {
		const parser = createTemporalFrequencyParser({
			parser: { mode: "regex", pattern: "[", sourceUnit: "day" },
			valueMap: {},
		});
		expect(parser.error).not.toBeNull();
		expect(parser.parse("2020-01-01")).toBeNull();
	});

	test("requires regex mappings to match and uses their capture or matched value", () => {
		const capturedDateParser = createTemporalFrequencyParser({
			parser: { mode: "regex", pattern: "date=(\\d{4}-\\d{2}-\\d{2})", sourceUnit: "day" },
			valueMap: {},
		});
		const matchedDateParser = createTemporalFrequencyParser({
			parser: { mode: "regex", pattern: "\\d{4}-\\d{2}-\\d{2}", sourceUnit: "day" },
			valueMap: {},
		});

		expect(capturedDateParser.parse("date=2020-05-12")?.toISOString()).toBe(
			"2020-05-12T00:00:00.000Z",
		);
		expect(matchedDateParser.parse("record 2020-05-12")?.toISOString()).toBe(
			"2020-05-12T00:00:00.000Z",
		);
		expect(capturedDateParser.parse("2020-05-12")).toBeNull();
	});

	test("rejects invalid calendar values without normalizing them", () => {
		const dayParser = createTemporalFrequencyParser({
			parser: { mode: "date", sourceUnit: "day" },
			valueMap: {},
		});
		const weekParser = createTemporalFrequencyParser({
			parser: { mode: "date", sourceUnit: "week" },
			valueMap: {},
		});
		const historicalYearParser = createTemporalFrequencyParser({
			parser: { mode: "year", sourceUnit: "year" },
			valueMap: {},
		});

		expect(dayParser.parse("2020-02-30")).toBeNull();
		expect(weekParser.parse("2021-W53")).toBeNull();
		expect(historicalYearParser.parse("0001")?.toISOString()).toBe("0001-01-01T00:00:00.000Z");
	});

	test("only offers bucket units supported by every source", () => {
		expect(getAllowedTemporalBucketUnits(["day"])).toStrictEqual([
			"day",
			"week",
			"month",
			"quarter",
			"year",
		]);
		expect(getAllowedTemporalBucketUnits(["day", "month"])).toStrictEqual([
			"month",
			"quarter",
			"year",
		]);
		expect(getAllowedTemporalBucketUnits(["year", "day"])).toStrictEqual(["year"]);
		expect(getAllowedTemporalBucketUnits(["week"])).toStrictEqual(["week", "year"]);
	});

	test("ignores invalid mappings when finding shared bucket units", () => {
		expect(
			getAllowedTemporalBucketUnitsForMappings([
				{ parser: { mode: "date", sourceUnit: "day" }, valueMap: {} },
				{ parser: { mode: "regex", pattern: "[", sourceUnit: "year" }, valueMap: {} },
			]),
		).toStrictEqual(["day", "week", "month", "quarter", "year"]);
	});
});

test.describe("temporal frequency aggregation", () => {
	test("aggregates dates into the selected buckets and fills gaps", () => {
		expect(
			aggregateTemporalFrequencies(
				[
					{ date: utc("2019-12-31"), absolute: 100, relative: 10 },
					{ date: utc("2020-01-03"), absolute: 2, relative: 0.2 },
					{ date: utc("2020-01-20"), absolute: 3, relative: 0.3 },
					{ date: utc("2020-03-01"), absolute: 4, relative: 0.4 },
				],
				{ start: utc("2020-01-01"), end: utc("2020-04-01") },
				"month",
			).map(({ date, ...frequency }) => ({ date: date.toISOString(), ...frequency })),
		).toStrictEqual([
			{ date: "2020-01-01T00:00:00.000Z", absolute: 5, relative: 0.5 },
			{ date: "2020-02-01T00:00:00.000Z", absolute: 0, relative: 0 },
			{ date: "2020-03-01T00:00:00.000Z", absolute: 4, relative: 0.4 },
		]);
	});

	test("uses ISO week-years when aggregating weekly data into years", () => {
		expect(
			aggregateTemporalFrequencies(
				[{ date: utc("2019-12-30"), absolute: 3, relative: 0.3 }],
				{ start: utc("2020-01-01"), end: utc("2021-01-01") },
				"year",
				"week",
			).map(({ date, ...frequency }) => ({ date: date.toISOString(), ...frequency })),
		).toStrictEqual([{ date: "2020-01-01T00:00:00.000Z", absolute: 3, relative: 0.3 }]);
	});

	test("keeps partial intervals at both boundaries", () => {
		const points = [
			[utc("2020-01-01").getTime(), 1],
			[utc("2020-02-01").getTime(), 2],
			[utc("2020-03-01").getTime(), 3],
			[utc("2020-04-01").getTime(), 4],
			[utc("2020-05-01").getTime(), 5],
		] satisfies Array<[number, number]>;

		const forward = groupTemporalFrequencyPoints(points, 2, false);
		const reverse = groupTemporalFrequencyPoints(points, 2, true);
		expect(forward).toStrictEqual([
			{
				startTimestamp: utc("2020-01-01").getTime(),
				endTimestamp: utc("2020-02-01").getTime(),
				value: 3,
			},
			{
				startTimestamp: utc("2020-03-01").getTime(),
				endTimestamp: utc("2020-04-01").getTime(),
				value: 7,
			},
			{
				startTimestamp: utc("2020-05-01").getTime(),
				endTimestamp: utc("2020-05-01").getTime(),
				value: 5,
			},
		]);
		expect(
			reverse.map((item) => formatTemporalFrequencyInterval(item, "month", "en")),
		).toStrictEqual([
			["Jan 2020", 1],
			["Feb 2020–Mar 2020", 5],
			["Apr 2020–May 2020", 9],
		]);
		expect(
			forward.map((item) => formatTemporalFrequencyInterval(item, "month", "en")),
		).toStrictEqual([
			["Jan 2020–Feb 2020", 3],
			["Mar 2020–Apr 2020", 7],
			["May 2020", 5],
		]);
	});

	test("formats timestamps using the selected bucket unit", () => {
		const timestamp = utc("2020-07-01").getTime();
		expect(formatTemporalTimestamp(timestamp, "year", "en")).toBe("2020");
		expect(formatTemporalTimestamp(timestamp, "quarter", "en")).toBe("Q3 2020");
		expect(formatTemporalTimestamp(timestamp, "month", "en")).toBe("Jul 2020");
	});
});

test.describe("temporal visualization settings", () => {
	test("migrates legacy year ranges to an end-exclusive ISO date range", () => {
		const settings = normalizeTemporalFrequencyDistributionSettings({
			yearRange: { start: 2020, end: 2024 },
			intervalSize: 2,
		});
		expect(settings.bucketUnit).toBe("year");
		expect(settings.dateRange).toStrictEqual({
			start: "2020-01-01T00:00:00.000Z",
			end: "2025-01-01T00:00:00.000Z",
		});
	});

	test("rejects invalid ranges and unsupported intervals", () => {
		const settings = normalizeTemporalFrequencyDistributionSettings({
			bucketUnit: "day",
			dateRange: { start: "invalid", end: "also-invalid" },
			intervalSize: 0,
		});
		expect(settings.dateRange).toStrictEqual(
			defaultTemporalFrequencyDistributionSettings.dateRange,
		);
		expect(settings.intervalSize).toBe(defaultTemporalFrequencyDistributionSettings.intervalSize);
	});

	test("limits each bucket unit to ten thousand generated buckets", () => {
		const start = utc("2020-01-01");
		const tenThousandDays = new Date(start.getTime() + 10_000 * 86_400_000);
		const tenThousandAndOneDays = new Date(start.getTime() + 10_001 * 86_400_000);
		expect(isTemporalBucketRangeSupported(start, tenThousandDays, "day")).toBe(true);
		expect(isTemporalBucketRangeSupported(start, tenThousandAndOneDays, "day")).toBe(false);
	});
});

test.describe("chart series alignment", () => {
	test("uses categorical interval labels in tooltips instead of their x index", () => {
		expect(getChartTooltipDomainValue([["Jan 2020–Feb 2020", 4]], "categorical", 0)).toBe(
			"Jan 2020–Feb 2020",
		);
	});

	test("aligns timestamp series by domain value when the first series is empty", () => {
		const january = utc("2020-01-01").getTime();
		const february = utc("2020-02-01").getTime();
		expect(
			alignChartSeriesData([
				[],
				[
					[january, 2],
					[february, 3],
				],
				[[february, 7]],
			]),
		).toStrictEqual([
			[
				[january, 0],
				[january, 2],
				[january, 0],
			],
			[
				[february, 0],
				[february, 3],
				[february, 7],
			],
		]);
	});
});
