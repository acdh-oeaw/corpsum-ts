import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import type { UserDocument } from "@/server/models/user.schema";

export default defineEventHandler(async (event) => {
	const { username, password }: UserDocument = await readBody(event);

	const hashed = bcrypt.hashSync(password, 10);

	try {
		await mongoose.connection.db
			?.collection<UserDocument>("users")
			.insertOne({ username, password: hashed });
	} catch {
		throw createError({
			statusMessage: "user already registered.",
		});
	}

	await setAuth(event, username);

	return {
		registered: true,
		user: username,
	};
});
