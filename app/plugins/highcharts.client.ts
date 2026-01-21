/* eslint-disable @typescript-eslint/no-unused-vars, simple-import-sort/imports */
import Highcharts from "highcharts";
import AccessibilityModule from "highcharts/modules/accessibility";
import ExportingModule from "highcharts/modules/exporting";
import ExportingDataModule from "highcharts/modules/export-data";
import MapsModule from "highcharts/modules/map";
import WordCloudModule from "highcharts/modules/wordcloud";
import HighchartsVue from "highcharts-vue";

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.use(HighchartsVue, { tagName: "HighCharts" });
});
