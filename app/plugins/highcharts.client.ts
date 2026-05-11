/* eslint-disable @typescript-eslint/no-unused-vars, simple-import-sort/imports */
import Highcharts from "highcharts";
import HighchartsVue from "highcharts-vue";
import AccessibilityModule from "highcharts/modules/accessibility";
import ExportingDataModule from "highcharts/modules/export-data";
import ExportingModule from "highcharts/modules/exporting";
import MapsModule from "highcharts/modules/map";
import WordCloudModule from "highcharts/modules/wordcloud";

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.use(HighchartsVue, { tagName: "HighCharts" });
});
