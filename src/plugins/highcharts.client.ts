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

	Highcharts.setOptions({
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
					`<span style="display:block;width:${labelWidth}px;`,
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
