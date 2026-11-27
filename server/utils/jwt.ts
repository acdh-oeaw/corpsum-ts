import { jwtVerify, SignJWT } from "jose";

import type { AuthPayload } from "@/types/server";

function getJwtSecret() {
	return new TextEncoder().encode(useRuntimeConfig().authSecret);
}

export function getJwtExpirationMs() {
	return useRuntimeConfig().jwtExpiration;
}

export async function createJWT(username: string) {
	const expiresAt = new Date(Date.now() + getJwtExpirationMs());

	return await new SignJWT({ username })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuer("acdh-ch.corpsum")
		.setIssuedAt()
		.setExpirationTime(expiresAt)
		.sign(getJwtSecret());
}

export async function verifyJWT(token: string) {
	return (await jwtVerify(token, getJwtSecret())).payload as AuthPayload;
}
