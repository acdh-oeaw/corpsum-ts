import Highcharts from "highcharts";
import AccessibilityModule from "highcharts/modules/accessibility";
import ExportingDataModule from "highcharts/modules/export-data";
import ExportingModule from "highcharts/modules/exporting";
import MapsModule from "highcharts/modules/map";
import WordCloudModule from "highcharts/modules/wordcloud";
import HighchartsVue from "highcharts-vue";

import { HighchartsExcelDownload } from "./helpers/highchartsExcelFunction";

export default defineNuxtPlugin((nuxtApp) => {
	MapsModule(Highcharts);
	ExportingModule(Highcharts);
	ExportingDataModule(Highcharts);
	AccessibilityModule(Highcharts);
	WordCloudModule(Highcharts);

	// overwrites the excel download to work propperly. this part is copied and adapted from a highcharts fiddle using that library. could be adapted to use a more maintained one, but would only recomend, if issues surface
	HighchartsExcelDownload(Highcharts);
	// @ts-ignore
	nuxtApp.vueApp.use(HighchartsVue, { tagName: "HighCharts" });
});
