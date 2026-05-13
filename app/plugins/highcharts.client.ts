/* eslint-disable simple-import-sort/imports */
import Highcharts from "highcharts";
import HighchartsVue from "highcharts-vue";

export default defineNuxtPlugin(async (nuxtApp) => {
	// Highcharts v12 module wrappers resolve from this global in some bundle modes.
	(globalThis as typeof globalThis & { _Highcharts?: typeof Highcharts })._Highcharts = Highcharts;

	const initModule = (module: { default?: unknown }) => {
		if (typeof module.default === "function") {
			(module.default as (highcharts: typeof Highcharts) => void)(Highcharts);
		}
	};

	const mapModule = await import("highcharts/modules/map");
	const exportingModule = await import("highcharts/modules/exporting");
	const exportDataModule = await import("highcharts/modules/export-data");
	const accessibilityModule = await import("highcharts/modules/accessibility");
	const wordCloudModule = await import("highcharts/modules/wordcloud");

	initModule(mapModule);
	initModule(exportingModule);
	initModule(exportDataModule);
	initModule(accessibilityModule);
	initModule(wordCloudModule);

	nuxtApp.vueApp.use(HighchartsVue, {
		tagName: "HighCharts",
		highcharts: Highcharts,
	});
});
