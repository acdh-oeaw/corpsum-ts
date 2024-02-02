import { expect } from '@playwright/test';

import { search } from '../fixtures/corpsum.fixtures';

const account = { username: process.env.TEST_USER!, password: process.env.TEST_PASSWORD! };

search.use({ account, term: 'haus' });

search.describe("Search Result Display", () => {
	search('should be able to display result information on selected searches', async ({page}) => {
		await expect(page.locator('div:nth-child(1) > .v-card-title > div > .text-xl')).toBeVisible();
		await expect(page.locator('div:nth-child(1) > .v-card-title > div > .text-xl')).toHaveText('haus');
		await expect(page.locator('.flex > span > .v-chip__content').first()).toBeVisible()
		await expect(page.locator('.flex > span > .v-chip__content').first()).toHaveText('amc_4.2');
		await expect(page.locator('.flex > span > .v-chip__content').nth(1)).toBeVisible();
		await expect(page.locator('.flex > span > .v-chip__content').nth(1)).toHaveText('iqueryrow');
	});
});
