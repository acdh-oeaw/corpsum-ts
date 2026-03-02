import Highcharts from "highcharts";
import AccessibilityModule from "highcharts/modules/accessibility";
import ExportingDataModule from "highcharts/modules/export-data";
import ExportingModule from "highcharts/modules/exporting";
import MapsModule from "highcharts/modules/map";
import WordCloudModule from "highcharts/modules/wordcloud";
import HighchartsVue from "highcharts-vue";

import { HighchartsExcelDownload } from "./helpers/highchartsExcelFunction";

const escapeHtml = (value: string) =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");

export default defineNuxtPlugin((nuxtApp) => {
	MapsModule(Highcharts);
	ExportingModule(Highcharts);
	ExportingDataModule(Highcharts);
	AccessibilityModule(Highcharts);
	WordCloudModule(Highcharts);

	Highcharts.addEvent(Highcharts.Chart, "render", function () {
		const chart = this as Highcharts.Chart & { __fullTitleText?: string };
		const maxWidth = Math.max(120, chart.plotWidth);
		const configuredTitle =
			chart.userOptions.title?.text ?? chart.options.title?.text ?? "";
		const fullTitle = chart.__fullTitleText ?? String(configuredTitle);
		chart.__fullTitleText = fullTitle;
		chart.title.css({ whiteSpace: "nowrap" });

		chart.title.attr({ text: fullTitle });
		if (chart.title.getBBox().width <= maxWidth) return;

		let low = 0;
		let high = fullTitle.length;
		let best = "";
		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			const candidate = `${fullTitle.slice(0, mid).trimEnd()}...`;
			chart.title.attr({ text: candidate });
			if (chart.title.getBBox().width <= maxWidth) {
				best = candidate;
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}
		chart.title.attr({ text: best || "..." });
	});

	Highcharts.setOptions({
		title: {
			style: {
				whiteSpace: "nowrap",
			},
		},
		legend: {
			useHTML: true,
			layout: "vertical",
			align: "center",
			verticalAlign: "bottom",
			alignColumns: false,
			labelFormatter: function (this: {
				chart?: { plotWidth?: number; chartWidth?: number };
				name?: string;
			}) {
				const chartWidth = this.chart?.plotWidth ?? this.chart?.chartWidth ?? 600;
				const labelWidth = Math.max(240, chartWidth);
				const name = escapeHtml(this.name ?? "");
				return [
					`<span style="display:block;width:${labelWidth.toString()}px;`,
					'white-space:normal;overflow-wrap:anywhere;line-height:1.2;">',
					name,
					"</span>",
				].join("");
			},
			itemStyle: {
				textOverflow: "clip",
				whiteSpace: "normal",
			},
		},
	});

	// overwrites the excel download to work propperly. this part is copied and adapted from a highcharts fiddle using that library. could be adapted to use a more maintained one, but would only recomend, if issues surface
	HighchartsExcelDownload(Highcharts);
	// @ts-expect-error this works and is like in the documentation
	nuxtApp.vueApp.use(HighchartsVue, { tagName: "HighCharts" });
});
