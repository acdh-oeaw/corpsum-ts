import Highcharts from "highcharts";
import ExportingDataModule from "highcharts/modules/export-data";
import ExportingModule from "highcharts/modules/exporting";
import MapsModule from "highcharts/modules/map";
import HighchartsVue from "highcharts-vue";

// In order to use Highcharts Maps we need to
// wrap Highcharts with the correct module:

export default defineNuxtPlugin((nuxtApp) => {
	MapsModule(Highcharts);
	ExportingModule(Highcharts);
	ExportingDataModule(Highcharts);
	// @ts-ignore
	nuxtApp.vueApp.use(HighchartsVue, { tagName: "HighCharts" });
});
