import { test as base } from '@playwright/test';

interface Account {
	username: string;
	password: string;
}

export const test = base.extend<NonNullable<unknown>, { account: Account }>({
	account: [{ username: "", password: "" }, { scope: 'worker' }],
	page: async ({ page, account }, use) => {
		const { username, password } = account;
		await page.goto('/login');
		await page.getByLabel('Username').fill(username);
		await page.getByLabel('Password').fill(password);
		await page.locator('#main-content').getByRole('button', { name: 'Login' }).click();
		await use(page);
	},
});

export { expect } from '@playwright/test';
