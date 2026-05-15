import { locales } from "@/config/i18n.config";
import { expect, test } from "~/e2e/lib/test";

test.describe("login page", () => {
	test("should show login controls", async ({ createI18n, page }) => {
		for (const locale of locales) {
			const i18n = await createI18n(locale);

			await page.goto(`/${locale}/login`);

			await expect(page.getByPlaceholder(i18n.t("username"))).toBeVisible();
			await expect(page.getByPlaceholder(i18n.t("password"))).toBeVisible();
			await expect(page.getByRole("button", { name: i18n.t("login") }).first()).toBeVisible();
			await expect(
				page.getByRole("link", { name: i18n.t("LoginPage.actions.createAccount") }),
			).toHaveAttribute("href", `/${locale}/signup`);
			await expect(
				page.getByRole("link", { name: i18n.t("LoginPage.actions.continueWithGithub") }),
			).toHaveAttribute(
				"href",
				`/api/auth/sso/github?redirect=%2F${locale}&errorRedirect=%2F${locale}%2Flogin`,
			);

			await expect(page.getByLabel(i18n.t("SignupPage.labels.email"))).toBeHidden();
		}
	});

	test("should show signup controls", async ({ createI18n, page }) => {
		for (const locale of locales) {
			const i18n = await createI18n(locale);

			await page.goto(`/${locale}/signup`);

			await expect(page.getByLabel(i18n.t("username"))).toBeVisible();
			await expect(page.getByLabel(i18n.t("SignupPage.labels.email"))).toBeVisible();
			await expect(page.getByLabel(i18n.t("password"), { exact: true })).toBeVisible();
			await expect(page.getByLabel(i18n.t("SignupPage.labels.passwordConfirmation"))).toBeVisible();
			await expect(
				page.getByRole("button", { name: i18n.t("LoginPage.actions.createAccount") }).first(),
			).toBeVisible();
			await expect(
				page.getByRole("link", { name: i18n.t("LoginPage.actions.loginInstead") }),
			).toHaveAttribute("href", `/${locale}/login`);
			await expect(
				page.getByRole("link", { name: i18n.t("LoginPage.actions.continueWithGithub") }),
			).toHaveAttribute(
				"href",
				`/api/auth/sso/github?redirect=%2F${locale}&errorRedirect=%2F${locale}%2Fsignup`,
			);
		}
	});

	test("should validate signup fields", async ({ createI18n, page }) => {
		const i18n = await createI18n("en");

		await page.goto("/en/signup");
		await page.getByRole("button", { name: i18n.t("LoginPage.actions.createAccount") }).click();

		await expect(page.getByText(i18n.t("SignupPage.validation.required")).first()).toBeVisible();

		await page.getByLabel(i18n.t("username")).fill("NO");
		await expect(page.getByText(i18n.t("SignupPage.validation.username"))).toBeVisible();

		await page.getByLabel(i18n.t("SignupPage.labels.email")).fill("not-an-email");
		await expect(page.getByText(i18n.t("SignupPage.validation.email"))).toBeVisible();

		await page.getByLabel(i18n.t("password"), { exact: true }).fill("weak");
		await expect(
			page.getByText(i18n.t("SignupPage.validation.password", { min: 12 })),
		).toBeVisible();

		await page.getByLabel(i18n.t("password"), { exact: true }).fill("StrongPassword1!");
		await page
			.getByLabel(i18n.t("SignupPage.labels.passwordConfirmation"))
			.fill("StrongPassword2!");
		await expect(
			page.getByText(i18n.t("SignupPage.validation.passwordConfirmation")),
		).toBeVisible();
	});
});
