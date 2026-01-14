import { fileURLToPath } from "node:url";

// noinspection ES6PreferShortImport
import { defaultLocale, localesMap } from "./app/config/i18n.config";

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

	components: [{ extensions: [".vue"], path: "@/components", pathPrefix: false }],

	css: [
		"tailwindcss/tailwind.css",
		"@fontsource-variable/inter/standard.css",
		"@fontsource-variable/inter/standard-italic.css",
		"@/styles/shadcn.css",
		"@/styles/index.css",
	],

	devtools: {
		enabled: true,
	},

	eslint: {
		config: {
			autoInit: false,
			standalone: true,
		},
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
		compatibilityVersion: 4,
	},

	i18n: {
		baseUrl,
		defaultLocale,
		detectBrowserLanguage: {
			redirectOn: "root",
		},
		langDir: "../i18n/messages",
		lazy: true,
		locales: Object.values(localesMap),
		strategy: "prefix",
		vueI18n: "../i18n/i18n.config.ts",
	},

	imports: {
		dirs: ["./config/"],
	},

	modules: [
		"@nuxt/eslint",
		"@nuxtjs/color-mode",
		"@nuxtjs/i18n",
		"@vueuse/nuxt",
		"@nuxtjs/tailwindcss",
		"shadcn-nuxt",
		"nuxt-mongoose",
		"@pinia/nuxt",
		"pinia-plugin-persistedstate/nuxt",
	],

	mongoose: {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		uri: `mongodb://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`,
		options: {},
		modelsDir: "models",
		devtools: false,
	},

	pinia: {
		storesDirs: ["./app/stores/**"],
	},

	piniaPluginPersistedstate: {
		cookieOptions: {
			sameSite: "strict",
		},
	},

	shadcn: {
		prefix: "",
		componentDir: "./app/components/ui",
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

	postcss: {
		plugins: {
			tailwindcss: {},
		},
	},

	runtimeConfig: {
		authSecret: process.env.NUXT_AUTH_SECRET,
		jwtExpiration: process.env.NUXT_JWT_EXPIRATION,
		public: {
			appBaseUrl: process.env.NUXT_PUBLIC_APP_BASE_URL,
			bots: process.env.NUXT_PUBLIC_BOTS,
			googleSiteVerification: process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
			matomoBaseUrl: process.env.NUXT_PUBLIC_MATOMO_BASE_URL,
			matomoId: process.env.NUXT_PUBLIC_MATOMO_ID,
			redmineId: process.env.NUXT_PUBLIC_REDMINE_ID,
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

	compatibilityDate: "2025-01-28",
});
