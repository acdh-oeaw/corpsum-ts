import { defineVitestConfig } from '@nuxt/test-utils/config'


export default defineVitestConfig({
	test: {
		environment: "nuxt",
		environmentOptions: {
			nuxt: {
				// domEnvironment: "jsdom",
			},
		},
		include: ["./tests/*.spec.ts"],
		setupFiles: ["../tests/setup-files/create-i18n.ts"],
	},
});
