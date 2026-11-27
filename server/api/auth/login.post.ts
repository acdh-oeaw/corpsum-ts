import bcrypt from "bcryptjs";

import { UserModel } from "~/server/models/users.schema";
import { setAuth } from "~/server/utils/auth";
import { getJwtExpirationMs } from "~/server/utils/jwt";
import { loginRequestSchema } from "~/shared/request-schemas";

const errorMessage = "username or password is wrong! please try again";

export default defineEventHandler(async (event) => {
	const credentials = loginRequestSchema.safeParse(await readBody<unknown>(event));
	if (!credentials.success) {
		setResponseStatus(event, 400, "required field missing");
		return;
	}
	const { username, password } = credentials.data;

	const user = await UserModel.findOne({ username });
	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: errorMessage,
		});
	}

	if (!user.password) {
		throw createError({
			statusCode: 401,
			statusMessage: errorMessage,
		});
	}

	const matches = bcrypt.compareSync(password, user.password);

	if (!matches) {
		throw createError({
			statusCode: 401,
			statusMessage: errorMessage,
		});
	}

	await setAuth(event, user.username);

	return {
		loggedIn: true,
		user: user.username,
		expires: Date.now() + getJwtExpirationMs(),
	};
});
