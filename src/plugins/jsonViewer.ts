import "vue-json-viewer/style.css";

// esilint-ignore-next-line  @typescript-eslint/ban-ts-comment
import JsonViewer from "vue-json-viewer/ssr";

export default defineNuxtPlugin((nuxtApp) => {
	// eslint-disable-next-line
	nuxtApp.vueApp.use(JsonViewer);
});
