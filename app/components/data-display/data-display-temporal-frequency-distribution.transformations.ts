import {
	temporalUnits,
	type CorpusMetadataMappingResponse,
	type TemporalUnit,
	isTemporalUnit,
} from "@/lib/visualization-types";

export interface TemporalFrequency {
	date: Date;
	absolute: number;
	relative: number;
}

export type TemporalFrequencyPoint = [timestamp: number, value: number];
export type TemporalIntervalFrequencyPoint = [dateRange: string, value: number];

export interface TemporalFrequencyInterval {
	startTimestamp: number;
	endTimestamp: number;
	value: number;
}

export interface TemporalFrequencyParser {
	parse: (rawValue: string) => Date | null;
	error: string | null;
}

const allowedBucketUnitsBySourceUnit = {
	day: ["day", "week", "month", "quarter", "year"],
	week: ["week", "month", "quarter", "year"],
	month: ["month", "quarter", "year"],
	quarter: ["quarter", "year"],
	year: ["year"],
} as const satisfies Record<TemporalUnit, ReadonlyArray<TemporalUnit>>;

function isValidRegularExpression(pattern: string) {
	try {
		RegExp(pattern, "u");
		return true;
	} catch {
		return false;
	}
}

function createUtcDate(year: number, month = 0, day = 1) {
	const date = new Date(0);
	date.setUTCFullYear(year, month, day);
	date.setUTCHours(0, 0, 0, 0);
	return date;
}

function parseYear(value: string) {
	if (!/^\d{4}$/u.test(value)) return null;
	return createUtcDate(Number(value));
}

function parseQuarter(value: string) {
	const match = /^(?<year>\d{4})-?Q(?<quarter>[1-4])$/u.exec(value);
	if (!match?.groups) return null;
	return createUtcDate(Number(match.groups.year), (Number(match.groups.quarter) - 1) * 3);
}

function parseMonth(value: string) {
	const match = /^(?<year>\d{4})-(?<month>0?[1-9]|1[0-2])$/u.exec(value);
	if (!match?.groups) return null;
	return createUtcDate(Number(match.groups.year), Number(match.groups.month) - 1);
}

function getIsoWeekStart(year: number, week: number) {
	const fourthOfJanuary = createUtcDate(year, 0, 4);
	const day = fourthOfJanuary.getUTCDay() || 7;
	const firstMonday = new Date(fourthOfJanuary);
	firstMonday.setUTCDate(fourthOfJanuary.getUTCDate() - day + 1);
	firstMonday.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);
	return firstMonday;
}

function getIsoWeekParts(value: Date) {
	const date = floorDateToUnit(value, "day");
	date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
	const yearStart = createUtcDate(date.getUTCFullYear());
	return {
		year: date.getUTCFullYear(),
		week: Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7),
	};
}

function parseWeek(value: string) {
	const match = /^(?<year>\d{4})-?W(?<week>0?[1-9]|[1-4]\d|5[0-3])$/u.exec(value);
	if (!match?.groups) return null;
	const year = Number(match.groups.year);
	const week = Number(match.groups.week);
	const date = getIsoWeekStart(year, week);
	const isoWeek = getIsoWeekParts(date);
	return isoWeek.year === year && isoWeek.week === week ? date : null;
}

function parseIsoCalendarDate(value: string) {
	const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})(?:T.*)?$/u.exec(value);
	if (!match?.groups) return null;
	const year = Number(match.groups.year);
	const month = Number(match.groups.month);
	const day = Number(match.groups.day);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const date = createUtcDate(year, month - 1, day);
	return date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
		? date
		: null;
}

function parseDateAtSourcePrecision(value: string, sourceUnit: TemporalUnit) {
	const preciseDate =
		sourceUnit === "year"
			? parseYear(value)
			: sourceUnit === "quarter"
				? parseQuarter(value)
				: sourceUnit === "month"
					? parseMonth(value)
					: sourceUnit === "week"
						? parseWeek(value)
						: null;
	if (preciseDate) return preciseDate;
	const date = parseIsoCalendarDate(value);
	return date ? floorDateToUnit(date, sourceUnit) : null;
}

export function createTemporalFrequencyParser(
	mapping: Pick<CorpusMetadataMappingResponse, "parser" | "valueMap">,
): TemporalFrequencyParser {
	const sourceUnit = isTemporalUnit(mapping.parser.sourceUnit) ? mapping.parser.sourceUnit : "year";
	const pattern = mapping.parser.mode === "regex" ? mapping.parser.pattern : undefined;
	const expression = pattern && isValidRegularExpression(pattern) ? new RegExp(pattern, "u") : null;

	if (mapping.parser.mode === "regex" && !expression) {
		return {
			parse: () => null,
			error: "The temporal metadata mapping contains an invalid regular expression.",
		};
	}

	return {
		parse(rawValue) {
			const normalized = mapping.valueMap?.[rawValue] ?? rawValue;
			if (normalized.trim() === "") return null;
			if (mapping.parser.mode === "year") return parseYear(normalized);
			const match = expression?.exec(normalized);
			if (expression && !match) return null;
			const captured =
				match?.groups?.date ?? match?.groups?.year ?? match?.[1] ?? match?.[0] ?? normalized;
			return parseDateAtSourcePrecision(captured, sourceUnit);
		},
		error: null,
	};
}

export function getTemporalSourceUnit(
	mapping: Pick<CorpusMetadataMappingResponse, "parser">,
): TemporalUnit {
	return isTemporalUnit(mapping.parser.sourceUnit) ? mapping.parser.sourceUnit : "year";
}

export function getAllowedTemporalBucketUnits(sourceUnits: Array<TemporalUnit>) {
	if (sourceUnits.length === 0) return [...temporalUnits];
	return temporalUnits.filter((unit) =>
		sourceUnits.every((sourceUnit) =>
			(allowedBucketUnitsBySourceUnit[sourceUnit] as ReadonlyArray<TemporalUnit>).includes(unit),
		),
	);
}

export function floorDateToUnit(value: Date, unit: TemporalUnit) {
	const date = new Date(value);
	date.setUTCHours(0, 0, 0, 0);
	if (unit === "day") return date;
	if (unit === "week") {
		const day = date.getUTCDay() || 7;
		date.setUTCDate(date.getUTCDate() - day + 1);
		return date;
	}
	date.setUTCDate(1);
	if (unit === "month") return date;
	if (unit === "quarter") {
		date.setUTCMonth(Math.floor(date.getUTCMonth() / 3) * 3);
		return date;
	}
	date.setUTCMonth(0);
	return date;
}

export function addTemporalUnits(value: Date, unit: TemporalUnit, amount: number) {
	const date = new Date(value);
	if (unit === "day") date.setUTCDate(date.getUTCDate() + amount);
	else if (unit === "week") date.setUTCDate(date.getUTCDate() + amount * 7);
	else if (unit === "month") date.setUTCMonth(date.getUTCMonth() + amount);
	else if (unit === "quarter") date.setUTCMonth(date.getUTCMonth() + amount * 3);
	else date.setUTCFullYear(date.getUTCFullYear() + amount);
	return date;
}

export function aggregateTemporalFrequencies(
	frequencies: Array<TemporalFrequency>,
	dateRange: { start: Date; end: Date },
	bucketUnit: TemporalUnit,
): Array<TemporalFrequency> {
	const totalsByTimestamp = new Map<number, TemporalFrequency>();
	for (const frequency of frequencies) {
		if (frequency.date < dateRange.start || frequency.date >= dateRange.end) continue;
		const date = floorDateToUnit(frequency.date, bucketUnit);
		const timestamp = date.getTime();
		const current = totalsByTimestamp.get(timestamp) ?? {
			date,
			absolute: 0,
			relative: 0,
		};
		current.absolute += frequency.absolute;
		current.relative += frequency.relative;
		totalsByTimestamp.set(timestamp, current);
	}

	const buckets: Array<TemporalFrequency> = [];
	for (
		let date = floorDateToUnit(dateRange.start, bucketUnit);
		date < dateRange.end;
		date = addTemporalUnits(date, bucketUnit, 1)
	) {
		buckets.push(totalsByTimestamp.get(date.getTime()) ?? { date, absolute: 0, relative: 0 });
	}
	return buckets;
}

export function groupTemporalFrequencyPoints(
	points: Array<TemporalFrequencyPoint>,
	intervalSize: number,
	useReverseIntervals: boolean,
): Array<TemporalFrequencyInterval> {
	if (!Number.isSafeInteger(intervalSize) || intervalSize <= 0) return [];
	const source = useReverseIntervals ? [...points].reverse() : points;
	const intervalCount = Math.ceil(source.length / intervalSize);
	const intervals = Array.from({ length: intervalCount }, (_, index) => {
		const intervalPoints = source.slice(index * intervalSize, (index + 1) * intervalSize);
		const timestamps = intervalPoints.map(([timestamp]) => timestamp);
		return {
			startTimestamp: Math.min(...timestamps),
			endTimestamp: Math.max(...timestamps),
			value: intervalPoints.reduce((sum, [, value]) => sum + value, 0),
		};
	});
	return useReverseIntervals ? intervals.reverse() : intervals;
}

export function formatTemporalTimestamp(timestamp: number, unit: TemporalUnit, locale?: string) {
	const date = new Date(timestamp);
	if (unit === "year") return String(date.getUTCFullYear());
	if (unit === "quarter")
		return `Q${String(Math.floor(date.getUTCMonth() / 3) + 1)} ${String(date.getUTCFullYear())}`;
	if (unit === "week") {
		const isoWeek = getIsoWeekParts(date);
		return `${String(isoWeek.year)}-W${String(isoWeek.week).padStart(2, "0")}`;
	}
	return new Intl.DateTimeFormat(locale, {
		timeZone: "UTC",
		year: "numeric",
		month: unit === "month" ? "short" : "2-digit",
		day: unit === "day" ? "2-digit" : undefined,
	}).format(date);
}

export function formatTemporalFrequencyInterval(
	interval: TemporalFrequencyInterval,
	unit: TemporalUnit,
	locale?: string,
): TemporalIntervalFrequencyPoint {
	const start = formatTemporalTimestamp(interval.startTimestamp, unit, locale);
	const end = formatTemporalTimestamp(interval.endTimestamp, unit, locale);
	return [start === end ? start : `${start}–${end}`, interval.value];
}
