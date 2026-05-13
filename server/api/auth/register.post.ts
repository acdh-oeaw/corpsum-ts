import bcrypt from "bcryptjs";

import { UserModel } from "~/server/models/users.schema";
import { setAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
	const { username, password } = await readBody<{
		username?: string;
		password?: string;
	}>(event);

	if (!username || !password) {
		setResponseStatus(event, 400, "required field missing");
		return;
	}

	const hashed = bcrypt.hashSync(password, 10);

	try {
		await UserModel.create({ username, password: hashed, accounttype: "user" });
	} catch (error) {
		setResponseStatus(event, 500, "database error");
		return `ERROR: ${error as string}`;
	}

	await setAuth(event, username);

	return {
		registered: true,
		user: username,
	};
});
