import { join } from "node:path";

import { config as dotenv } from "@dotenvx/dotenvx";
import { defineConfig, devices } from "@playwright/test";
import isCI from "is-in-ci";

/**
 * Reading `.env` files here instead of using `dotenvx run` so environment variables are available
 * to the vs code plugin as well.
 */
dotenv({
	path: [".env.test.local", "local.env", ".env.test", ".env"].map((envFilePath) =>
		join(process.cwd(), envFilePath),
	),
	ignore: ["MISSING_ENV_FILE"],
	quiet: true,
});

const port = 3000;
const baseUrl = `http://localhost:${String(port)}`;

export default defineConfig({
	testDir: "./e2e",
	snapshotDir: "./e2e/snapshots",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	maxFailures: 10,
	workers: isCI ? 1 : undefined,
	reporter: isCI ? [["github"], ["html", { open: "never" }]] : [["html"]],
	use: {
		baseURL: baseUrl,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "setup",
			testMatch: "global.setup.ts",
		},
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
			dependencies: ["setup"],
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
			dependencies: ["setup"],
		},
		/** Test against mobile viewports. */
		// {
		//      name: "Mobile Chrome",
		//      use: { ...devices["Pixel 5"] },
		//      dependencies: ["setup"],
		// },
		// {
		//      name: "Mobile Safari",
		//      use: { ...devices["iPhone 12"] },
		//      dependencies: ["setup"],
		// },
		/** Test against branded browsers. */
		// {
		//      name: "Microsoft Edge",
		//      use: { ...devices["Desktop Edge"], channel: "msedge" },
		//      dependencies: ["setup"],
		// },
		// {
		//      name: "Google Chrome",
		//      use: { ...devices["Desktop Chrome"], channel: "chrome" },
		//      dependencies: ["setup"],
		// },
	],
	webServer: {
		command: "pnpm run start",
		url: baseUrl,
		reuseExistingServer: !isCI,
	},
});
