import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";

import { defineConfig, type OxlintGlobals } from "oxlint";

const projectRoot = import.meta.dirname;
const globalsFile = path.join(projectRoot, ".nuxt/oxlint-globals.json");

function loadNuxtGlobals(): OxlintGlobals {
	if (!existsSync(globalsFile)) {
		throw new Error("Missing generated Nuxt globals. Run `nuxt prepare` before linting.");
	}

	return JSON.parse(readFileSync(globalsFile, { encoding: "utf8" })) as OxlintGlobals;
}

const config = defineConfig({
	categories: {
		correctness: "error",
		suspicious: "warn",
	},
	env: {
		browser: true,
		builtin: true,
		esnext: true,
		node: true,
	},
	globals: loadNuxtGlobals(),
	ignorePatterns: ["content/**", "public/**", "tsconfig.json", "e2e/tsconfig.json"],
	jsPlugins: [
		{ name: "better-tailwindcss", specifier: "eslint-plugin-better-tailwindcss" },
		{ name: "playwright", specifier: "eslint-plugin-playwright" },
	],
	options: {
		reportUnusedDisableDirectives: "warn",
		typeAware: false,
		typeCheck: false,
	},
	plugins: ["import", "node", "typescript", "vue", "oxc"],
	rules: {
		"no-shadow": "off",
		"no-underscore-dangle": "off",
		"no-unsafe-type-assertion": "off",
		"import/namespace": "warn",
	},
	settings: {
		"better-tailwindcss": {
			entryPoint: path.resolve(projectRoot, "app/styles/index.css"),
		},
	},
	overrides: [
		{
			files: ["app/**/*.{ts,tsx,vue}"],
			rules: {
				"better-tailwindcss/no-unknown-classes": ["warn", { ignore: ["lead", "not-richtext"] }],
				"better-tailwindcss/no-conflicting-classes": "warn",
				"better-tailwindcss/no-restricted-classes": "warn",
				"better-tailwindcss/enforce-canonical-classes": "warn",
				"better-tailwindcss/enforce-consistent-class-order": ["warn", { order: "strict" }],
				"better-tailwindcss/enforce-consistent-important-position": "off",
				"better-tailwindcss/enforce-consistent-line-wrapping": "off",
				"better-tailwindcss/enforce-consistent-variable-syntax": "warn",
				"better-tailwindcss/enforce-consistent-variant-order": "warn",
				"better-tailwindcss/enforce-logical-properties": "warn",
				"better-tailwindcss/enforce-shorthand-classes": "off",
				"better-tailwindcss/no-deprecated-classes": "warn",
				"better-tailwindcss/no-duplicate-classes": "warn",
				"better-tailwindcss/no-unnecessary-whitespace": "warn",
			},
		},
		{
			files: ["e2e/**/*.{ts,tsx}"],
			rules: {
				"playwright/consistent-spacing-between-blocks": "warn",
				"playwright/expect-expect": "warn",
				"playwright/max-expects": "off",
				"playwright/max-nested-describe": "warn",
				"playwright/missing-playwright-await": "warn",
				"playwright/no-commented-out-tests": "warn",
				"playwright/no-conditional-expect": "warn",
				"playwright/no-conditional-in-test": "warn",
				"playwright/no-duplicate-hooks": "warn",
				"playwright/no-duplicate-slow": "warn",
				"playwright/no-element-handle": "warn",
				"playwright/no-eval": "warn",
				"playwright/no-focused-test": "warn",
				"playwright/no-force-option": "warn",
				"playwright/no-get-by-title": "warn",
				"playwright/no-hooks": "off",
				"playwright/no-nested-step": "warn",
				"playwright/no-networkidle": "warn",
				"playwright/no-nth-methods": "off",
				"playwright/no-page-pause": "warn",
				"playwright/no-raw-locators": "warn",
				"playwright/no-restricted-locators": "off",
				"playwright/no-restricted-matchers": "off",
				"playwright/no-restricted-roles": "off",
				"playwright/no-skipped-test": "warn",
				"playwright/no-slowed-test": "warn",
				"playwright/no-standalone-expect": "warn",
				"playwright/no-unsafe-references": "warn",
				"playwright/no-unused-locators": "warn",
				"playwright/no-useless-await": "warn",
				"playwright/no-useless-not": "warn",
				"playwright/no-wait-for-navigation": "warn",
				"playwright/no-wait-for-selector": "warn",
				"playwright/no-wait-for-timeout": "warn",
				"playwright/prefer-comparison-matcher": "warn",
				"playwright/prefer-equality-matcher": "warn",
				"playwright/prefer-hooks-in-order": "warn",
				"playwright/prefer-hooks-on-top": "warn",
				"playwright/prefer-lowercase-title": "warn",
				"playwright/prefer-native-locators": "warn",
				"playwright/prefer-locator": "warn",
				"playwright/prefer-strict-equal": "warn",
				"playwright/prefer-to-be": "warn",
				"playwright/prefer-to-contain": "warn",
				"playwright/prefer-to-have-count": "warn",
				"playwright/prefer-to-have-length": "warn",
				"playwright/prefer-web-first-assertions": "warn",
				"playwright/require-hook": "off",
				"playwright/require-soft-assertions": "off",
				"playwright/require-tags": "off",
				"playwright/require-to-pass-timeout": "warn",
				"playwright/require-to-throw-message": "warn",
				"playwright/require-top-level-describe": "warn",
				"playwright/valid-describe-callback": "warn",
				"playwright/valid-expect-in-promise": "warn",
				"playwright/valid-expect": "warn",
				"playwright/valid-title": "warn",
				"playwright/valid-test-tags": "warn",
			},
		},
	],
});

export default config;
