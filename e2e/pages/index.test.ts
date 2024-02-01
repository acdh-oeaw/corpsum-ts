import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("should have document title", async ({ page }) => {
		await page.goto("/en/login");
		await expect(page).toHaveTitle("Login | ACDH-CH App");

		await page.goto("/de/login");
		await expect(page).toHaveTitle("Login | ACDH-CH App");
	});
});
