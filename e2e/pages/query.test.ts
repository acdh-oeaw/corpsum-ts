import { expect, test } from '@playwright/test';

test.describe("Log In & execute a query", () => {
	test('test', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByRole('heading', { name: 'Please Login' })).toBeVisible();
		await page.getByPlaceholder('username').fill('corpsum');
		await page.getByPlaceholder('password').fill('');
		await page.getByPlaceholder('password').press('Enter');
		await expect(page.getByRole('heading', { name: 'Corpsum' })).toBeVisible();

		await page.getByRole('button', { name: 'Corpus Open' }).click();
		await page.getByText('amc_4.2').click();
		await page.getByPlaceholder('Your search term').fill('haus');
		await page.getByPlaceholder('Your search term').press('Enter');
		await expect(page.locator('.flex > span > .v-chip__content').first()).toHaveText('amc_4.2');
	});
});

test.describe("Log In & execute 2 queries", () => {
	test('test', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByRole('heading', { name: 'Please Login' })).toBeVisible();
		await page.getByPlaceholder('username').fill('corpsum');
		await page.getByPlaceholder('password').fill('');
		await page.getByPlaceholder('password').press('Enter');
		await expect(page.getByRole('heading', { name: 'Corpsum' })).toBeVisible();

		await page.getByRole('button', { name: 'Corpus Open' }).click();
		await page.getByText('amc_4.2').click();
		await page.getByPlaceholder('Your search term').fill('haus');
		await page.getByPlaceholder('Your search term').press('Enter');
		await expect(page.locator('.flex > span > .v-chip__content').first()).toHaveText('amc_4.2');

		await page.getByRole('button', { name: 'amc_4.2 Open' }).click();
		await page.getByText('amc_3.2').click();
		await page.getByPlaceholder('Your search term').click();
		await page.getByPlaceholder('Your search term').fill('tomate');
		await page.getByPlaceholder('Your search term').press('Enter');
		await expect(page.locator('div:nth-child(2) > .v-card-title > div > .text-xl')).toHaveText('tomate');
	});
});

export { expect } from '@playwright/test';
