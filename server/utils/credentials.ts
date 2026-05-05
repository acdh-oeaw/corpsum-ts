import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const encryptionPrefix = "v1";
const algorithm = "aes-256-gcm";

function getCredentialSecret(): string {
	const config = useRuntimeConfig();
	const secret = String(config.credentialSecret || config.authSecret || "");

	if (secret.length < 32) {
		throw createError({
			statusCode: 500,
			statusMessage: "Credential encryption secret is not configured",
		});
	}

	return secret;
}

function getKey() {
	return createHash("sha256").update(getCredentialSecret()).digest();
}

export function encryptCredentialPassword(password: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv(algorithm, getKey(), iv);
	const encrypted = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();

	return [
		encryptionPrefix,
		iv.toString("base64url"),
		tag.toString("base64url"),
		encrypted.toString("base64url"),
	].join(":");
}

export function decryptCredentialPassword(value: string): string {
	const [version, iv, tag, encrypted] = value.split(":");

	if (version !== encryptionPrefix || !iv || !tag || !encrypted) {
		return value;
	}

	const decipher = createDecipheriv(algorithm, getKey(), Buffer.from(iv, "base64url"));
	decipher.setAuthTag(Buffer.from(tag, "base64url"));

	return Buffer.concat([
		decipher.update(Buffer.from(encrypted, "base64url")),
		decipher.final(),
	]).toString("utf8");
}
