import { fileURLToPath } from "node:url";

// noinspection ES6PreferShortImport
import { defaultLocale, files } from "./app/config/i18n.config";
import oxlintGlobals from "./modules/oxlint-globals";

const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;
const databaseUrl = process.env.DATABASE_URL!;

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
		"@nuxt/fonts",
		"@nuxt/hints",
		"@nuxt/icon",
		"@nuxt/image",
		"@nuxt/scripts",
		"@nuxt/test-utils",
		"@nuxtjs/color-mode",
		"@nuxtjs/i18n",
		"@vueuse/nuxt",
		"nuxt-mongoose",
		"@pinia/nuxt",
		"pinia-plugin-persistedstate/nuxt",
	],

	mongoose: {
		uri: databaseUrl,
		options: {},
		modelsDir: "models",
		devtools: false,
	},

	piniaPluginPersistedstate: {
		cookieOptions: {
			sameSite: "strict",
		},
	},

	postcss: {
		plugins: {
			"@tailwindcss/postcss": {},
		},
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

	plugins: [{ src: "@/plugins/highcharts.client.ts", mode: "client" }],

	runtimeConfig: {
		authSecret: process.env.NUXT_AUTH_SECRET,
		credentialSecret: process.env.NUXT_CREDENTIAL_SECRET ?? process.env.NUXT_AUTH_SECRET,
		jwtExpiration: process.env.NUXT_JWT_EXPIRATION,
		oauth: {
			github: {
				clientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
				clientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET,
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
		build: {
			cssMinify: "lightningcss",
			sourcemap: "hidden",
		},
	},

	compatibilityDate: "2026-01-01",
});
