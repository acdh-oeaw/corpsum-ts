import { createHash, randomBytes } from "node:crypto";

import { createUrl } from "@acdh-oeaw/lib";
import {
	deleteCookie,
	getCookie,
	getHeader,
	getRequestURL,
	sendRedirect,
	setCookie,
	type H3Event,
} from "h3";

import { defaultLocale, isValidLocale } from "@/config/i18n.config";
import { AuthIdentityModel, type AuthProvider } from "~/server/models/authidentities.schema";
import { type UserDocument, UserModel } from "~/server/models/users.schema";

const oauthCookiePrefix = "corpsum_oauth";
const oauthCookieMaxAge = 10 * 60;

interface OAuthProviderConfig {
	provider: AuthProvider;
	authorizationUrl: string;
	tokenUrl: string;
	userUrl: string;
	emailsUrl: string;
	scopes: Array<string>;
	clientId?: string;
	clientSecret?: string;
}

interface OAuthProfile {
	provider: AuthProvider;
	providerAccountId: string;
	username: string;
	email?: string;
	emailVerified: boolean;
}

interface GitHubTokenResponse {
	access_token?: string;
	error?: string;
	error_description?: string;
}

interface GitHubUserResponse {
	id?: number;
	login?: string;
	email?: string | null;
}

interface GitHubEmailResponse {
	email?: string;
	primary?: boolean;
	verified?: boolean;
}

export function getOAuthProvider(provider: AuthProvider): OAuthProviderConfig {
	const config = useRuntimeConfig();

	return {
		provider,
		authorizationUrl: "https://github.com/login/oauth/authorize",
		tokenUrl: "https://github.com/login/oauth/access_token",
		userUrl: "https://api.github.com/user",
		emailsUrl: "https://api.github.com/user/emails",
		scopes: ["read:user", "user:email"],
		clientId: config.oauth.github.clientId,
		clientSecret: config.oauth.github.clientSecret,
	};
}

export function assertOAuthProviderConfigured(providerConfig: OAuthProviderConfig): void {
	if (!providerConfig.clientId || !providerConfig.clientSecret) {
		throw createError({
			statusCode: 503,
			statusMessage: `${providerConfig.provider} OAuth is not configured.`,
		});
	}
}

export function createOAuthState(): string {
	return randomBytes(32).toString("base64url");
}

export function createCodeVerifier(): string {
	return randomBytes(32).toString("base64url");
}

export function createCodeChallenge(codeVerifier: string): string {
	return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function getOAuthRedirectPath(event: H3Event): string {
	return getSafeRequestPath(event, "redirect") ?? getFallbackRedirectPath(event);
}

export function getOAuthErrorRedirectPath(event: H3Event): string {
	return (
		getSafeRequestPath(event, "errorRedirect") ??
		getLoginPathForRedirect(getFallbackRedirectPath(event))
	);
}

function getSafeRequestPath(event: H3Event, parameter: string): string | undefined {
	const requestUrl = getRequestURL(event);
	const redirect = requestUrl.searchParams.get(parameter);

	if (redirect?.startsWith("/") === true && !redirect.startsWith("//")) {
		return redirect;
	}

	return undefined;
}

function getFallbackRedirectPath(event: H3Event): string {
	const referer = getHeader(event, "referer");
	if (referer) {
		try {
			const refererUrl = new URL(referer);
			const locale = refererUrl.pathname.split("/")[1] ?? "";
			if (isValidLocale(locale)) return `/${locale}`;
		} catch {
			// Ignore malformed referrers and fall back to the default locale.
		}
	}

	return `/${defaultLocale}`;
}

export function setOAuthCookies(
	event: H3Event,
	provider: AuthProvider,
	payload: { state: string; codeVerifier: string; redirectPath: string; errorRedirectPath: string },
): void {
	const options = {
		httpOnly: true,
		maxAge: oauthCookieMaxAge,
		path: "/",
		sameSite: "lax" as const,
		secure: getRequestURL(event).protocol === "https:",
	};

	setCookie(event, `${oauthCookiePrefix}_${provider}_state`, payload.state, options);
	setCookie(event, `${oauthCookiePrefix}_${provider}_verifier`, payload.codeVerifier, options);
	setCookie(event, `${oauthCookiePrefix}_${provider}_redirect`, payload.redirectPath, options);
	setCookie(
		event,
		`${oauthCookiePrefix}_${provider}_error_redirect`,
		payload.errorRedirectPath,
		options,
	);
}

export function readAndClearOAuthCookies(event: H3Event, provider: AuthProvider) {
	const state = getCookie(event, `${oauthCookiePrefix}_${provider}_state`);
	const codeVerifier = getCookie(event, `${oauthCookiePrefix}_${provider}_verifier`);
	const redirectPath =
		getCookie(event, `${oauthCookiePrefix}_${provider}_redirect`) ?? `/${defaultLocale}`;
	const errorRedirectPath =
		getCookie(event, `${oauthCookiePrefix}_${provider}_error_redirect`) ??
		getLoginPathForRedirect(redirectPath);

	deleteCookie(event, `${oauthCookiePrefix}_${provider}_state`, { path: "/" });
	deleteCookie(event, `${oauthCookiePrefix}_${provider}_verifier`, { path: "/" });
	deleteCookie(event, `${oauthCookiePrefix}_${provider}_redirect`, { path: "/" });
	deleteCookie(event, `${oauthCookiePrefix}_${provider}_error_redirect`, { path: "/" });

	return { state, codeVerifier, redirectPath, errorRedirectPath };
}

function getLoginPathForRedirect(redirectPath: string): string {
	const locale = redirectPath.split("/")[1] ?? "";
	return `/${isValidLocale(locale) ? locale : defaultLocale}/login`;
}

export function getOAuthCallbackUrl(event: H3Event, provider: AuthProvider): string {
	const { public: publicConfig } = useRuntimeConfig();
	return String(
		createUrl({
			baseUrl: publicConfig.appBaseUrl,
			pathname: `/api/auth/sso/${provider}/callback`,
		}),
	);
}

export function buildOAuthAuthorizationUrl(
	event: H3Event,
	providerConfig: OAuthProviderConfig,
	payload: { state: string; codeChallenge: string },
): string {
	const url = new URL(providerConfig.authorizationUrl);
	url.searchParams.set("client_id", providerConfig.clientId ?? "");
	url.searchParams.set("redirect_uri", getOAuthCallbackUrl(event, providerConfig.provider));
	url.searchParams.set("scope", providerConfig.scopes.join(" "));
	url.searchParams.set("state", payload.state);
	url.searchParams.set("code_challenge", payload.codeChallenge);
	url.searchParams.set("code_challenge_method", "S256");
	return url.toString();
}

export async function exchangeGitHubCode(
	event: H3Event,
	providerConfig: OAuthProviderConfig,
	payload: { code: string; codeVerifier: string },
): Promise<string> {
	const response = await fetch(providerConfig.tokenUrl, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: providerConfig.clientId ?? "",
			client_secret: providerConfig.clientSecret ?? "",
			code: payload.code,
			code_verifier: payload.codeVerifier,
			redirect_uri: getOAuthCallbackUrl(event, providerConfig.provider),
		}),
	});

	if (!response.ok) {
		throw createError({
			statusCode: 502,
			statusMessage: "GitHub token exchange failed.",
		});
	}

	const data = (await response.json()) as GitHubTokenResponse;
	if (!data.access_token) {
		throw createError({
			statusCode: 401,
			statusMessage: data.error_description ?? data.error ?? "GitHub token exchange failed.",
		});
	}

	return data.access_token;
}

export async function fetchGitHubProfile(
	providerConfig: OAuthProviderConfig,
	accessToken: string,
): Promise<OAuthProfile> {
	const headers = {
		Accept: "application/vnd.github+json",
		Authorization: `Bearer ${accessToken}`,
		"X-GitHub-Api-Version": "2022-11-28",
	};

	const userResponse = await fetch(providerConfig.userUrl, { headers });
	if (!userResponse.ok) {
		throw createError({
			statusCode: 502,
			statusMessage: "GitHub user lookup failed.",
		});
	}

	const user = (await userResponse.json()) as GitHubUserResponse;
	if (typeof user.id !== "number" || !user.login) {
		throw createError({
			statusCode: 502,
			statusMessage: "GitHub user lookup returned an invalid profile.",
		});
	}

	const email = await fetchGitHubVerifiedEmail(providerConfig, headers);

	return {
		provider: providerConfig.provider,
		providerAccountId: String(user.id),
		username: user.login,
		email,
		emailVerified: Boolean(email),
	};
}

async function fetchGitHubVerifiedEmail(
	providerConfig: OAuthProviderConfig,
	headers: Record<string, string>,
): Promise<string | undefined> {
	const response = await fetch(providerConfig.emailsUrl, { headers });
	if (!response.ok) return undefined;

	const emails = (await response.json()) as Array<GitHubEmailResponse>;
	const primaryVerified = emails.find((entry) => entry.primary === true && entry.verified === true);
	const firstVerified = emails.find((entry) => entry.verified === true);
	return (primaryVerified?.email ?? firstVerified?.email)?.toLowerCase();
}

export async function findOrCreateOAuthUser(profile: OAuthProfile): Promise<UserDocument> {
	const existingIdentity = await AuthIdentityModel.findOne({
		provider: profile.provider,
		providerAccountId: profile.providerAccountId,
	}).populate<{ user: UserDocument }>("user");

	if (existingIdentity?.user) {
		return existingIdentity.user;
	}

	const email = profile.emailVerified ? profile.email : undefined;
	let user = email ? await UserModel.findOne({ email }) : null;

	if (!user) {
		user = await UserModel.create({
			accounttype: "user",
			email,
			username: await createUniqueUsername(profile.username),
		});
	}

	await AuthIdentityModel.create({
		provider: profile.provider,
		providerAccountId: profile.providerAccountId,
		user: user._id,
		username: profile.username,
		email,
	});

	return user;
}

async function createUniqueUsername(preferredUsername: string): Promise<string> {
	const base = normalizeUsername(preferredUsername);
	const existing = await UserModel.exists({ username: base });
	if (!existing) return base;

	for (let index = 2; index < 1000; index += 1) {
		const username = `${base}-${String(index)}`;
		const match = await UserModel.exists({ username });
		if (!match) return username;
	}

	return `${base}-${randomBytes(4).toString("hex")}`;
}

function normalizeUsername(value: string): string {
	const username = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 48);

	return username || "github-user";
}

export async function redirectToOAuthError(event: H3Event, redirectPath = `/${defaultLocale}`) {
	const url = new URL(redirectPath, useRuntimeConfig().public.appBaseUrl);
	url.searchParams.set("error", "sso");
	return await sendRedirect(event, url.toString(), 302);
}
