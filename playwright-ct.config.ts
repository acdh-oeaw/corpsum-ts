import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/experimental-ct-vue";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import isCI from "is-in-ci";

export default defineConfig({
	testDir: "./e2e/tests/components",
	testMatch: "**/*.spec.ts",
	snapshotDir: "./e2e/snapshots/components",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 1 : undefined,
	reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["html"]],
	use: {
		trace: "on-first-retry",
		ctViteConfig: {
			plugins: [vue(), tailwindcss()],
			resolve: {
				alias: {
					"@": fileURLToPath(new URL("./app/", import.meta.url)),
					"~": fileURLToPath(new URL("./", import.meta.url)),
				},
			},
		},
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
