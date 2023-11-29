
import Highcharts from "highcharts";
import MapsModule from "highcharts/modules/map";
import HighchartsVue from 'highcharts-vue'

// In order to use Highcharts Maps we need to
// wrap Highcharts with the correct module:




export default defineNuxtPlugin((nuxtApp) => {
	MapsModule(Highcharts);
	nuxtApp.vueApp.use(HighchartsVue, { tagName: 'HighCharts' });
});
