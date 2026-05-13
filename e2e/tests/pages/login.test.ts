import { locales } from "@/config/i18n.config";
import { expect, test } from "~/e2e/lib/test";

test.describe("login page", () => {
	test("should show local auth and GitHub SSO controls", async ({ createI18n, page }) => {
		for (const locale of locales) {
			const i18n = await createI18n(locale);

			await page.goto(`/${locale}/login`);

			await expect(page.getByPlaceholder(i18n.t("username"))).toBeVisible();
			await expect(page.getByPlaceholder(i18n.t("password"))).toBeVisible();
			await expect(page.getByRole("button", { name: i18n.t("login") }).first()).toBeVisible();
			await expect(
				page.getByRole("button", { name: i18n.t("LoginPage.actions.createAccount") }).first(),
			).toBeVisible();
			await expect(
				page.getByRole("link", { name: i18n.t("LoginPage.actions.continueWithGithub") }),
			).toHaveAttribute("href", `/api/auth/sso/github?redirect=%2F${locale}`);
		}
	});
});
