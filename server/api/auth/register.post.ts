import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import type { UserDocument } from "~/server/models/users.schema";
import { setAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
	const { username, password }: UserDocument = await readBody(event);

	const hashed = bcrypt.hashSync(password, 10);

	try {
		await mongoose.connection.db
			?.collection<UserDocument>("users")
			.insertOne({ username, password: hashed, accounttype: "user" });
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
