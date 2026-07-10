import { expect, test } from "@playwright/test";

import {
	aggregateTemporalFrequencies,
	createTemporalFrequencyParser,
	formatTemporalFrequencyInterval,
	formatTemporalTimestamp,
	getAllowedTemporalBucketUnits,
	getAllowedTemporalBucketUnitsForMappings,
	groupTemporalFrequencyPoints,
} from "@/components/data-display/data-display-temporal-frequency-distribution.transformations.ts";
import {
	defaultTemporalFrequencyDistributionSettings,
	isTemporalBucketRangeSupported,
	normalizeTemporalFrequencyDistributionSettings,
} from "@/lib/visualization-types";
import { alignChartSeriesData, getChartTooltipDomainValue } from "@/utils/chart-data";

const utc = (value: string) => new Date(`${value}T00:00:00.000Z`);

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
