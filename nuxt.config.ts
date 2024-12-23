import { fileURLToPath } from "node:url";

import { defaultLocale, locales } from "./src/config/i18n.config";

export default defineNuxtConfig({
	alias: {
		"@": fileURLToPath(new URL("./src", import.meta.url)),
		"~": fileURLToPath(new URL("./", import.meta.url)),
	},

	components: [{ path: "@/components", pathPrefix: false }],

	content: {
		defaultLocale,
		locales: Object.keys(locales),
		markdown: {},
	},

	css: [
		"@fontsource-variable/inter/index.css",
		"tailwindcss/tailwind.css",
		"@/styles/index.css",
		"vuetify/lib/styles/main.sass",
		"@mdi/font/css/materialdesignicons.css",
	],

	devtools: {
		enabled: true,
	},

	dir: {
		public: "../public",
	},

	imports: {
		dirs: ["../stores", "./stores", "types"],
	},

	experimental: {
		componentIslands: true,
		renderJsonPayloads: false,
	},

	pinia: {
		// @ts-expect-error somehow there is no types for this
		autoImports: ["defineStore", "acceptHMRUpdate"],
	},

	piniaPersistedstate: {
		cookieOptions: {
			sameSite: "strict",
		},
	},

	i18n: {
		baseUrl: process.env.NUXT_PUBLIC_APP_BASE_URL,
		defaultLocale,
		detectBrowserLanguage: {
			redirectOn: "root",
		},
		langDir: "./messages",
		lazy: true,
		locales: Object.values(locales),
		strategy: "prefix",
	},

	shadcn: {
		/**
		 * Prefix for all the imported component
		 */
		prefix: "",
		/**
		 * Directory that the component lives in.
		 * @default "./components/ui"
		 */
		componentDir: "./src/components/ui",
	},

	modules: [
		"@nuxt/content",
		"@nuxt/devtools",
		"@nuxt/eslint",
		"@nuxtjs/i18n",
		"@pinia/nuxt",
		"@pinia-plugin-persistedstate/nuxt",
		"shadcn-nuxt",
	],
	eslint: {
		config: {
			standalone: true,
		},
	},
	nitro: {
		compressPublicAssets: true,
	},

	postcss: {
		plugins: {
			"tailwindcss/nesting": "postcss-nesting",
			tailwindcss: {},
			autoprefixer: {},
		},
	},

	routeRules: {
		"/": { static: true },
		"/imprint": { static: true },
	},

	runtimeConfig: {
		BOTS: process.env.BOTS,
		ENV_VALIDATION: process.env.ENV_VALIDATION,
		NODE_ENV: process.env.NODE_ENV,
		public: {
			apiBaseUrl: "",
			redmineId: "",
			NUXT_PUBLIC_APP_BASE_URL: process.env.NUXT_PUBLIC_APP_BASE_URL,
			NUXT_PUBLIC_MATOMO_BASE_URL: process.env.NUXT_PUBLIC_MATOMO_BASE_URL,
			NUXT_PUBLIC_MATOMO_ID: process.env.NUXT_PUBLIC_MATOMO_ID,
			NUXT_PUBLIC_REDMINE_ID: process.env.NUXT_PUBLIC_REDMINE_ID,
		},
	},

	build: {
		transpile: ["vuetify"],
	},

	srcDir: "./src/",

	typescript: {
		shim: false,
		strict: true,
		// https://github.com/nuxt/nuxt/issues/14816#issuecomment-1484918081
		tsConfig: {
			compilerOptions: {
				paths: {
					"@/*": ["./src/*"],
					"~/*": ["./*"],
				},
			},
		},
	},

	compatibilityDate: "2024-09-06",
});
