export type ChartDatum = [domainValue: string | number, value: number];

export function alignChartSeriesData(series: Array<Array<ChartDatum>>) {
	const domain = [
		...new Set(series.flatMap((points) => points.map(([domainValue]) => domainValue))),
	];
	const valuesBySeries = series.map(
		(points) => new Map(points.map(([domainValue, value]) => [domainValue, value])),
	);

	return domain.map((domainValue) =>
		valuesBySeries.map(
			(values) => [domainValue, values.get(domainValue) ?? 0] satisfies ChartDatum,
		),
	);
}
