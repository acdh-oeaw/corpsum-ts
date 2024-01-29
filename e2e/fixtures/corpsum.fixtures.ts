import { test as base } from '@playwright/test';

interface Account {
	username: string;
	password: string;
}

export const test = base.extend<NonNullable<unknown>, { account: Account }>({
	page: async ({ page, account }, use) => {
		const { username, password } = account;
		await page.getByPlaceholder('username').fill(username);
		await page.getByPlaceholder('password').fill(password);
		await page.getByPlaceholder('password').press('Enter');

		await use(page);
	},
});
export { expect } from '@playwright/test';
