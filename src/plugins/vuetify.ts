import "vuetify/styles";

import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";

export default defineNuxtPlugin((nuxtApp) => {
	// Adding Vuetify
	const vuetify = createVuetify({
		components,
		directives,
		icons: {
			defaultSet: "mdi",
			aliases,
			sets: {
				mdi,
			},
		},
		ssr: true,
	});
	nuxtApp.vueApp.use(vuetify);
});
