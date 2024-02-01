import { test as base } from '@playwright/test';

interface Account {
	username: string;
	password: string;
}

export const test = base.extend<NonNullable<unknown>, { account: Account }>({
	account: [{ username: "", password: "" }, { scope: 'worker' }],
	page: async ({ page, account }, use) => {
		const { username, password } = account;
		await page.goto('/en/login');
		await page.getByLabel('Username').fill(username);
		await page.getByLabel('Password').fill(password);
		const loginPromise = page.waitForResponse('https://noskecrystal5corpsum.acdh-dev.oeaw.ac.at/run.cgi/corpora');
		await page.locator('#main-content').getByRole('button', { name: 'Login' }).click();
		await loginPromise;
		await use(page);
	},
});

export { expect } from '@playwright/test';
