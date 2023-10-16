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
		"@fontsource-variable/inter/slnt.css",
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
		dirs: ["./stores"],
	},
	experimental: {
		componentIslands: true,
	},
	pinia: {
		autoImports: ["defineStore", "acceptHMRUpdate"],
	},
	piniaPersistedstate: {
		cookieOptions: {
			sameSite: "strict",
		},
		//	storage: 'localStorage'
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
		strategy: "prefix_except_default",
	},
	modules: [
		"@nuxt/content",
		"@nuxt/devtools",
		"@nuxtjs/i18n",
		"@nuxt/image",
		"nuxt-vitest",
		"@pinia/nuxt",
		"@pinia-plugin-persistedstate/nuxt",
	],
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
			apiBaseUrl: process.env.NUXT_API_BASE_URL,
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
});
