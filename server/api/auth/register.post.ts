import { hashSync } from "bcryptjs";

import { UserModel } from "~/server/models/users.schema";
import { setAuth } from "~/server/utils/auth";

const { jwtExpiration } = useRuntimeConfig();

export default defineEventHandler(async (event) => {
	const { username, password } = await readBody<{
		username?: string;
		password?: string;
	}>(event);
	const normalizedUsername = username?.trim();

	if (!normalizedUsername || !password) {
		setResponseStatus(event, 400, "required field missing");
		return;
	}

	const existingUser = await UserModel.exists({ username: normalizedUsername });
	if (existingUser) {
		throw createError({
			statusCode: 409,
			statusMessage: "username already exists",
		});
	}

	const hashed = hashSync(password, 10);

	try {
		await UserModel.create({ username: normalizedUsername, password: hashed, accounttype: "user" });
	} catch (error) {
		if (isDuplicateKeyError(error)) {
			throw createError({
				statusCode: 409,
				statusMessage: "username already exists",
			});
		}

		setResponseStatus(event, 500, "database error");
		return `ERROR: ${error as string}`;
	}

	await setAuth(event, normalizedUsername);

	return {
		registered: true,
		user: normalizedUsername,
		expires: Date.now() + parseInt(jwtExpiration),
	};
});

function isDuplicateKeyError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code: unknown }).code === 11000
	);
}
