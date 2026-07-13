import { jwtVerify, SignJWT } from "jose";

import type { AuthPayload } from "@/types/server";

const { authSecret, jwtExpiration } = useRuntimeConfig();

const JWT_SECRET = new TextEncoder().encode(authSecret);

export function getJwtExpirationMs() {
	const expirationMs = Number.parseInt(jwtExpiration ?? "", 10);
	if (!Number.isFinite(expirationMs) || expirationMs <= 0) {
		throw createError({ statusCode: 500, statusMessage: "JWT expiration is not configured" });
	}
	return expirationMs;
}

export async function createJWT(username: string) {
	const expiresAt = new Date(Date.now() + getJwtExpirationMs());

	return await new SignJWT({ username })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuer("acdh-ch.corpsum")
		.setIssuedAt()
		.setExpirationTime(expiresAt)
		.sign(JWT_SECRET);
}

export async function verifyJWT(token: string) {
	return (await jwtVerify(token, JWT_SECRET)).payload as AuthPayload;
}
