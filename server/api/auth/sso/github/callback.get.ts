import { sendRedirect } from "h3";

import { setAuth } from "~/server/utils/auth";
import {
	assertOAuthProviderConfigured,
	exchangeGitHubCode,
	fetchGitHubProfile,
	findOrCreateOAuthUser,
	getOAuthProvider,
	readAndClearOAuthCookies,
	redirectToOAuthError,
} from "~/server/utils/oauth";

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const code = typeof query.code === "string" ? query.code : undefined;
	const receivedState = typeof query.state === "string" ? query.state : undefined;
	const { state, codeVerifier, redirectPath } = readAndClearOAuthCookies(event, "github");

	if (!code || !receivedState || !state || !codeVerifier || receivedState !== state) {
		return await redirectToOAuthError(event, redirectPath);
	}

	try {
		const provider = getOAuthProvider("github");
		assertOAuthProviderConfigured(provider);

		const accessToken = await exchangeGitHubCode(event, provider, { code, codeVerifier });
		const profile = await fetchGitHubProfile(provider, accessToken);
		const user = await findOrCreateOAuthUser(profile);
		await setAuth(event, user.username);

		return await sendRedirect(event, redirectPath, 302);
	} catch {
		return await redirectToOAuthError(event, redirectPath);
	}
});
