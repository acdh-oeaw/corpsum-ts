import { expect } from '@playwright/test';

import { test } from '../fixtures/corpsum.fixtures';

const account = { username: "corpsum", password: "zM9wS1lR9uJ6zR9s" };
test.use({ account });

test.describe("Query Interface", () => {
	test('should be able to perform and display multiple queries', async ({ page }) => {

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
