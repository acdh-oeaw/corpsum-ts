/* eslint-disable @typescript-eslint/no-unused-vars, simple-import-sort/imports */
import Highcharts from "highcharts";
import HighchartsVue from "highcharts-vue";
import AccessibilityModule from "highcharts/modules/accessibility";
import ExportingDataModule from "highcharts/modules/export-data";
import ExportingModule from "highcharts/modules/exporting";
import MapsModule from "highcharts/modules/map";
import WordCloudModule from "highcharts/modules/wordcloud";

export default defineNuxtPlugin(async (nuxtApp) => {
	const globalWithHighcharts = globalThis as typeof globalThis & {
		_Highcharts?: typeof Highcharts;
	};
	globalWithHighcharts._Highcharts = Highcharts;

	const [MapsModule, ExportingModule, ExportingDataModule, AccessibilityModule, WordCloudModule] =
		await Promise.all([
			import("highcharts/modules/map.js"),
			import("highcharts/modules/exporting.js"),
			import("highcharts/modules/export-data.js"),
			import("highcharts/modules/accessibility.js"),
			import("highcharts/modules/wordcloud.js"),
		]);

	const resolveModule = (module: unknown) => {
		if (typeof module === "function") return module;
		if (typeof (module as { default?: unknown }).default === "function") {
			return (module as { default: (h: typeof Highcharts) => void }).default;
		}
		return null;
	};

	const mapsInit = resolveModule(MapsModule);
	const exportingInit = resolveModule(ExportingModule);
	const exportDataInit = resolveModule(ExportingDataModule);
	const accessibilityInit = resolveModule(AccessibilityModule);
	const wordCloudInit = resolveModule(WordCloudModule);

	mapsInit?.(Highcharts);
	exportingInit?.(Highcharts);
	if ("Exporting" in Highcharts) {
		exportDataInit?.(Highcharts);
	}
	accessibilityInit?.(Highcharts);
	wordCloudInit?.(Highcharts);

	nuxtApp.vueApp.use(HighchartsVue, {
		tagName: "HighCharts",
		highcharts: Highcharts,
	});
});
