import { jwtVerify, SignJWT } from "jose";

import type { AuthPayload } from "@/types/server";

const { authSecret, jwtExpiration } = useRuntimeConfig();

const JWT_SECRET = new TextEncoder().encode(authSecret as string);

export async function createJWT(username: string) {
	return await new SignJWT({ username })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuer("acdh-ch.corpsum")
		.setIssuedAt()
		.setExpirationTime(Date.now() + parseInt(jwtExpiration as string))
		.sign(JWT_SECRET);
}

export async function verifyJWT(token: string) {
	return (await jwtVerify(token, JWT_SECRET)).payload as AuthPayload;
}
