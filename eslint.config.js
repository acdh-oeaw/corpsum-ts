/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */

/** @typedef {Array<any>} Config */

import baseConfig from "@acdh-oeaw/eslint-config";
import nuxtConfig from "@acdh-oeaw/eslint-config-nuxt";
import playwrightConfig from "@acdh-oeaw/eslint-config-playwright";
import tailwindcssConfig from "@acdh-oeaw/eslint-config-tailwindcss";
import vueConfig from "@acdh-oeaw/eslint-config-vue";
import gitignore from "eslint-config-flat-gitignore";

import { withNuxt } from "./.nuxt/eslint.config.mjs";

/** @param {any} config */
const toConfigArray = (config) => /** @type {Config} */ (Array.isArray(config) ? config : [config]);

/** @type {Config} */
const config = [
	gitignore({ strict: false }),
	...toConfigArray(baseConfig),
	...toConfigArray(vueConfig),
	...toConfigArray(nuxtConfig),
	...toConfigArray(tailwindcssConfig),
	...toConfigArray(playwrightConfig),
	{
		rules: {
			"vue/attributes-order": ["warn", { alphabetical: true }],
		},
	},
];

export default withNuxt(/** @type {any} */ (config));
