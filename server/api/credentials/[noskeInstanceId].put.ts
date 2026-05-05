import { getRouterParam, readBody } from "h3";

import { encryptCredentialPassword } from "~/server/utils/credentials";
import { requireReadableNoske } from "~/server/utils/noske";
import { requireUser } from "~/server/utils/user";

interface CredentialPayload {
	username: string;
	password: string;
}

function isCredentialPayload(value: unknown): value is CredentialPayload {
	return (
		typeof value === "object" &&
		value !== null &&
		"username" in value &&
		"password" in value &&
		typeof value.username === "string" &&
		typeof value.password === "string" &&
		value.username.trim().length > 0 &&
		value.password.length > 0
	);
}

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const instanceId = getRouterParam(event, "noskeInstanceId");
	const noske = await requireReadableNoske(instanceId, user);
	const payload = (await readBody(event)) as unknown;

	if (!isCredentialPayload(payload)) {
		throw createError({
			statusCode: 400,
			statusMessage: "invalid credential payload",
		});
	}

	const credentials = user.credentials ?? [];
	const existing = credentials.find(
		(credential) => credential.noskeinstance.toString() === noske._id.toString(),
	);
	const nextCredential = {
		noskeinstance: noske._id,
		username: payload.username.trim(),
		password: encryptCredentialPassword(payload.password),
	};

	if (existing) {
		existing.username = nextCredential.username;
		existing.password = nextCredential.password;
	} else {
		credentials.push(nextCredential);
		user.credentials = credentials;
	}

	await user.save();

	return {
		noskeinstance: noske._id.toString(),
		noskeName: String(noske.name),
		username: nextCredential.username,
	};
});
