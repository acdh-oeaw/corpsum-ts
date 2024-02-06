import { test as base } from "@playwright/test";

interface Account {
	username: string;
	password: string;
}

interface Search {
	term: string;
	corpus: string;
}

export const login = base.extend<NonNullable<unknown>, { account: Account }>({
	account: [{ username: "", password: "" }, { scope: "worker" }],
	page: async ({ page, context, account }, use) => {
		const { username, password } = account;
		await page.goto("/en/login");
		await page.getByLabel("Username").fill(username);
		await page.getByLabel("Password").fill(password);
		const loginPromise = page.waitForResponse(
			"https://noskecrystal5corpsum.acdh-dev.oeaw.ac.at/run.cgi/corpora",
		);
		await page.locator("#main-content").getByRole("button", { name: "Login" }).click();
		await loginPromise;
		await use(page);
		await context.close();
	},
});

export const search = login.extend<NonNullable<unknown>, { search: Search }>({
	search: [{ term: "", corpus: "" }, { scope: "worker" }],
	page: async ({ page, context, search }, use) => {
		const { term, corpus } = search;
		await page.getByRole("combobox").first().click();
		const corpusPromise = page.waitForResponse(
			`https://noskecrystal5corpsum.acdh-dev.oeaw.ac.at/run.cgi/corp_info?corpname=${corpus}&subcorpora=1&format=json`,
		);
		await page.getByRole("option", { name: corpus }).click();
		await corpusPromise;
		await page.getByPlaceholder("Your search term").fill(term);
		const wordformFreqsPromise = page.waitForResponse(
			`https://noskecrystal5corpsum.acdh-dev.oeaw.ac.at/run.cgi/freqml?usecorp=${corpus}&corpname=${corpus}&default_attr=lemma&attrs=word&refs==doc.id&attr_allpos=all&viewmode=kwic&cup_hl=q&structs=s,+g&fromp=1&pagesize=20&kwicleftctx=100%23&kwicrightctx=100%23&json=%7B%22concordance_query%22:%7B%22iquery%22:%22${term}%22,%22queryselector%22:%22iqueryrow%22%7D%7D`,
		);
		await page.getByPlaceholder("Your search term").press("Enter");
		await wordformFreqsPromise;
		await use(page);
		await context.close();
	},
});
