import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/login");
		await expect(page).toHaveTitle("Login | ACDH-CH App");

		await page.goto("/de/imprint");
		await expect(page).toHaveTitle("Login | ACDH-CH App");
	});
});
