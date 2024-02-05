import { expect } from '@playwright/test';

import { login as test } from '../fixtures/corpsum.fixtures';

const account = { username: process.env.TEST_USER!, password: process.env.TEST_PASSWORD! };
test.use({ account });

test.describe("Query Interface", () => {
	test('should be able to display information on multiple queries', async ({ page }) => {
		await page.getByRole('combobox').first().click();
		const corpusPromise = page.waitForResponse('https://noskecrystal5corpsum.acdh-dev.oeaw.ac.at/run.cgi/corp_info?corpname=amc_4.2&subcorpora=1&format=json');
		await page.getByRole('option', { name: 'amc_4.2' }).click();
		await corpusPromise;
		await expect(page.locator('form')).toContainText('Number of tokens:');
		await page.getByPlaceholder('Your search term').fill('haus')
		await page.getByPlaceholder('Your search term').press('Enter');
		await expect(page.locator('div:nth-child(1) > .v-card-title > div > .text-xl')).toBeVisible();
		await expect(page.locator('div:nth-child(1) > .v-card-title > div > .text-xl')).toHaveText('haus');
		await expect(page.locator('.flex > span > .v-chip__content').first()).toBeVisible()
		await expect(page.locator('.flex > span > .v-chip__content').first()).toHaveText('amc_4.2');
		await expect(page.locator('.flex > span > .v-chip__content').nth(1)).toBeVisible();
		await expect(page.locator('.flex > span > .v-chip__content').nth(1)).toHaveText('iqueryrow');

		await page.getByRole('combobox').first().click();
		await page.getByRole('option', { name: 'amc_3.2' }).click();
		await page.getByRole('combobox').nth(2).click();
		await page.getByRole('option', { name: 'Word search' }).click();
		await page.getByPlaceholder('Your search term').click();
		await page.getByPlaceholder('Your search term').fill('tomate');
		await page.getByPlaceholder('Your search term').press('Enter');
		await expect(page.locator('div:nth-child(2) > .v-card-title > div > .text-xl')).toBeVisible();
		await expect(page.locator('div:nth-child(2) > .v-card-title > div > .text-xl')).toHaveText('tomate');
		await expect(page.locator('div:nth-child(2) > .v-card-text > .flex > span > .v-chip__content').first()).toBeVisible()
		await expect(page.locator('div:nth-child(2) > .v-card-text > .flex > span > .v-chip__content').first()).toHaveText('amc_3.2');
		await expect(page.locator('div:nth-child(2) > .v-card-text > .flex > span > .v-chip__content').nth(1)).toBeVisible();
		await expect(page.locator('div:nth-child(2) > .v-card-text > .flex > span > .v-chip__content').nth(1)).toHaveText('wordrow');
	});
	test('should be able select a corpus and select the available subcorpora', async ({ page }) => {
		await page.getByRole('combobox').first().click();
		const corpusPromise = page.waitForResponse('https://noskecrystal5corpsum.acdh-dev.oeaw.ac.at/run.cgi/corp_info?corpname=amc_4.2&subcorpora=1&format=json');
		await page.getByRole('option', { name: 'amc_4.2' }).click();
		await corpusPromise;
		await expect(page.locator('form')).toContainText('Number of tokens:');
		await page.getByRole('combobox').nth(1).click();
		await page.locator('div').filter({ hasText: /^AustriazismenSFB$/ }).first().click();
		await expect(page.locator('form')).toContainText('tokens:');
	});
});
