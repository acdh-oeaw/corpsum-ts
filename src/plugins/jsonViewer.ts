import "vue-json-viewer/style.css";

import JsonViewer from "vue-json-viewer/ssr";

export default defineNuxtPlugin((nuxtApp) => {
	// eslint-disable-next-line
	nuxtApp.vueApp.use(JsonViewer);
});
