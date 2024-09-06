import { defineVitestConfig } from '@nuxt/test-utils/config'


export default defineVitestConfig({
	// @ts-ignore this is exactly as in the documentation
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
