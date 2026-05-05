import bcrypt from "bcryptjs";

import { UserModel } from "~/server/models/users.schema";
import { setAuth } from "~/server/utils/auth";

const { jwtExpiration } = useRuntimeConfig();

const errorMessage = "username or password is wrong! please try again";

export default defineEventHandler(async (event) => {
	const { username, password } = await readBody<{
		username?: string;
		password?: string;
	}>(event);

	if (!username || !password) {
		setResponseStatus(event, 400, "required field missing");
		return;
	}

	const user = await UserModel.findOne({ username });
	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: errorMessage,
		});
	}

	const matches = bcrypt.compareSync(password, String(user.password));

	if (!matches) {
		throw createError({
			statusCode: 401,
			statusMessage: errorMessage,
		});
	}

	await setAuth(event, String(user.username));

	return {
		loggedIn: true,
		user: String(user.username),
		expires: Date.now() + parseInt(jwtExpiration),
	};
});
