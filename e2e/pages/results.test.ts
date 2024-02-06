import { expect } from "@playwright/test";

import { search as test } from "../fixtures/corpsum.fixtures";

const account = { username: process.env.TEST_USER!, password: process.env.TEST_PASSWORD! };
const search = { term: "haus", corpus: "amc_4.2" };
test.use({ account, search });

test.describe("Search Result Display", () => {
	test("should be able to display result information on selected searches", async ({ page }) => {
		await expect(page.locator("div:nth-child(1) > .v-card-title > div > .text-xl")).toBeVisible();
		await expect(page.locator("div:nth-child(1) > .v-card-title > div > .text-xl")).toHaveText(
			"haus",
		);
		await expect(page.locator(".flex > span > .v-chip__content").first()).toBeVisible();
		await expect(page.locator(".flex > span > .v-chip__content").first()).toHaveText("amc_4.2");
		await expect(page.locator(".flex > span > .v-chip__content").nth(1)).toBeVisible();
		await expect(page.locator(".flex > span > .v-chip__content").nth(1)).toHaveText("iqueryrow");
	});
});
