import {
	assertOAuthProviderConfigured,
	buildOAuthAuthorizationUrl,
	createCodeChallenge,
	createCodeVerifier,
	createOAuthState,
	getOAuthProvider,
	getOAuthRedirectPath,
	setOAuthCookies,
} from "~/server/utils/oauth";

export default defineEventHandler(async (event) => {
	const provider = getOAuthProvider("github");
	assertOAuthProviderConfigured(provider);

	const state = createOAuthState();
	const codeVerifier = createCodeVerifier();

	setOAuthCookies(event, "github", {
		state,
		codeVerifier,
		redirectPath: getOAuthRedirectPath(event),
	});

	return await sendRedirect(
		event,
		buildOAuthAuthorizationUrl(event, provider, {
			state,
			codeChallenge: createCodeChallenge(codeVerifier),
		}),
		302,
	);
});
