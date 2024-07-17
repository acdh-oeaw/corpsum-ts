import "vue-json-viewer/style.css";

// esilint-ignore-next-line
// @ts-ignore
import JsonViewer from "vue-json-viewer/ssr";

export default defineNuxtPlugin((nuxtApp) => {
	 
	nuxtApp.vueApp.use(JsonViewer);
});
