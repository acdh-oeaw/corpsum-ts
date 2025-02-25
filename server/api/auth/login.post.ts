import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import type { HttpResponse, Type03CorporaList } from "~/lib/api-client";
import type { UserDocument } from "~/server/models/users.schema";
import { setAuth } from "~/server/utils/auth";

const { jwtExpiration } = useRuntimeConfig();

const errorMessage = "username or password is wrong! please try again";

export default defineEventHandler(async (event) => {
	const { username, password }: UserDocument = await readBody(event);

	if (!username || !password) {
		setResponseStatus(event, 400, "required field missing");
		return;
	}

	let user = await mongoose.connection.db?.collection<UserDocument>("users").findOne({ username });
	//if the user is not registered, check if user is registered for AMC and register the user
	if (!user) {
		const env = useRuntimeConfig();

		const basicAuthString = `Basic ${btoa(`${username}:${password}`)}`;
		const corpora =
			(await
			(// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				await fetch(`${env.public.apiBaseUrl}/ca/api/corpora`, {
					headers: {
						Authorization: basicAuthString,
					},
				})
			).json()) as HttpResponse<Array<Type03CorporaList>>;
		if (Array.isArray(corpora.data)) {
			const hashed = bcrypt.hashSync(password, 10);
			try {
				await mongoose.connection.db?.collection<UserDocument>("users").insertOne({
					username,
					password: hashed,
					accounttype: "user",
					credentials: [
						{
							noskeinstance: new mongoose.Types.ObjectId("5c90a00f9ca403074db60bc7"),
							username,
							password,
						},
					],
				});
				user = await mongoose.connection.db
					?.collection<UserDocument>("users")
					.findOne({ username });
			} catch (error) {
				setResponseStatus(event, 500, "database error");
				return `ERROR: ${error as string}`;
			}
		} else {
			throw createError({
				statusMessage: errorMessage,
			});
		}
	}

	const matches = bcrypt.compareSync(password, user!.password);

	if (!matches) {
		throw createError({
			statusMessage: errorMessage,
		});
	}

	await setAuth(event, user!.username);

	return {
		loggedIn: true,
		user: user!.username,
		expires: Date.now() + parseInt(jwtExpiration),
	};
});
