import "@fontsource-variable/inter/standard.css";
import "@fontsource-variable/inter/standard-italic.css";
import "@/styles/index.css";

import { beforeMount } from "@playwright/experimental-ct-vue/hooks";
import { createI18n } from "vue-i18n";

import en from "~/i18n/messages/en.json";

beforeMount(async ({ app }) => {
	app.use(
		createI18n({
			legacy: false,
			locale: "en",
			messages: {
				en,
			},
		}),
	);
});
