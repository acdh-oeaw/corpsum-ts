import Highlighter from "vue-highlight-words";

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.component("TextHighlight", Highlighter);
});
