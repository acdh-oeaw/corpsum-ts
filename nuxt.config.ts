import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";

// noinspection ES6PreferShortImport
import { defaultLocale, files } from "./app/config/i18n.config.ts";
import oxlintGlobals from "./modules/oxlint-globals.ts";

const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;

export default defineNuxtConfig({
	alias: {
		"@": fileURLToPath(new URL("./app/", import.meta.url)),
		"~": fileURLToPath(new URL("./", import.meta.url)),
	},

	app: {
		layoutTransition: false,
		pageTransition: false,
	},

	colorMode: {
		classSuffix: "",
		dataValue: "ui-color-scheme",
	},

	components: [
		{
			extensions: [".vue"],
			path: "@/components",
			pathPrefix: false,
		},
	],

	css: [
		"@fontsource-variable/inter/standard.css",
		"@fontsource-variable/inter/standard-italic.css",
		"@/styles/index.css",
	],

	devtools: {
		enabled: true,
	},

	experimental: {
		// Required by @nuxtjs/i18n until https://github.com/nuxt-modules/i18n/issues/4175 is fixed.
		nitroAutoImports: true,
		componentIslands: {
			selectiveClient: true,
		},
		defaults: {
			useAsyncData: {
				deep: false,
			},
			useFetch: {
				timeout: 250,
			},
		},
		inlineRouteRules: true,
	},

	features: {
		/** @see https://github.com/nuxt/nuxt/issues/21821 */
		inlineStyles: false,
	},

	future: {
		compatibilityVersion: 5,
	},

	i18n: {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		baseUrl: baseUrl ?? "http://localhost:3000",
		defaultLocale,
		detectBrowserLanguage: {
			redirectOn: "root",
		},
		experimental: {
			typedOptionsAndMessages: "default",
		},
		langDir: "messages",
		locales: files,
		strategy: "prefix",
	},

	imports: {
		dirs: ["./config/"],
	},

	modules: [
		oxlintGlobals,
		"@nuxt/content",
		"@nuxt/fonts",
		["@nuxt/hints", { features: { hydration: { devtools: false, logs: true } } }],
		"@nuxt/icon",
		"@nuxt/image",
		"@nuxt/scripts",
		"@nuxt/test-utils",
		"@nuxtjs/color-mode",
		"@nuxtjs/i18n",
		"@vueuse/nuxt",
		"nuxt-mongoose",
		"nuxt-studio",
	],

	image: {
		// Documentation screenshots are served directly from public/.
		provider: "none",
	},

	mongoose: {
		uri: process.env.NODE_ENV === "development" ? (process.env.DATABASE_URL ?? "") : "",
		options: {},
		modelsDir: "models",
		devtools: false,
	},

	nitro: {
		compressPublicAssets: true,
		prerender: {
			routes: [],
		},
		experimental: {
			openAPI: true,
		},
	},

	runtimeConfig: {
		authSecret: "",
		credentialSecret: "",
		jwtExpiration: "",
		oauth: {
			github: {
				clientId: "",
				clientSecret: "",
			},
		},
		public: {
			appBaseUrl: process.env.NUXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000",
			bots: process.env.NUXT_PUBLIC_BOTS,
			googleSiteVerification: process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
			matomoBaseUrl: process.env.NUXT_PUBLIC_MATOMO_BASE_URL,
			matomoId: process.env.NUXT_PUBLIC_MATOMO_ID,
			redmineId: process.env.NUXT_PUBLIC_REDMINE_ID,
		},
	},

	sourcemap: {
		client: "hidden",
		server: "hidden",
	},

	content: {
		experimental: { sqliteConnector: "native" },
	},

	studio: {
		repository: {
			provider: "github",
			owner: "acdh-oeaw",
			repo: "corpsum-ts",
			branch: "dev",
			private: false,
		},
	},

	typescript: {
		shim: false,
		strict: true,
		// https://github.com/nuxt/nuxt/issues/14816#issuecomment-1484918081
		tsConfig: {
			compilerOptions: {
				baseUrl: ".",
				paths: {
					"@/*": ["./app/*"],
					"~/*": ["./*"],
				},
			},
		},
	},

	vite: {
		plugins: [tailwindcss()],
		build: {
			cssMinify: "lightningcss",
			sourcemap: "hidden",
		},
	},

	compatibilityDate: "2026-01-01",
});
