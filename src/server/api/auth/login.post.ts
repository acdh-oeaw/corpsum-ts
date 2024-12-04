import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import type { UserDocument } from "@/server/models/user.schema";
import type { HttpResponse, Type03CorporaList } from "~/lib/api-client";

const errorMessage = "username or password is wrong! please try again";

export default defineEventHandler(async (event) => {
	const { username, password }: UserDocument = await readBody(event);

	if (!username || !password) {
		throw createError({
			statusMessage: "required field missing",
		});
	}

	let user = await mongoose.connection.db?.collection<UserDocument>("users").findOne({ username });

	//if the user is not registered, check if user is registered for AMC and register the user
	if (!user) {
		const env = useRuntimeConfig();

		const basicAuthString = "Basic " + btoa(username + ":" + password);
		const corpora = (await (
			await fetch(env.public.apiBaseUrl + "/ca/api/corpora", {
				headers: {
					Authorization: basicAuthString,
				},
			})
		).json()) as HttpResponse<Array<Type03CorporaList>>;
		if (Array.isArray(corpora.data)) {
			const hashed = bcrypt.hashSync(password, 10);
			try {
				await mongoose.connection.db
					?.collection<UserDocument>("users")
					.insertOne({ username, password: hashed, basicAuthString, accounttype: "user",  });
				user = await mongoose.connection.db
					?.collection<UserDocument>("users")
					.findOne({ username });
			} catch {
				throw createError({
					statusMessage: errorMessage,
				});
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
	};
});
