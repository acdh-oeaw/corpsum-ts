import { defineEventHandler } from "h3";

import { type UserDocument, UserModel } from "~/server/models/users.schema";
import { requireAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
	const { username } = await requireAuth(event);
	const param_username = getRouterParam(event, "username");

	let user: UserDocument | null = null;

	try {
		user = await UserModel.findOne({
			username,
		});
	} catch (error) {
		setResponseStatus(event, 500, "database error");
		return `ERROR: ${error as string}`;
	}

	if (user && user.username === param_username) {
		return {
			username: user.username,
			email: user.email,
			accounttype: user.accounttype,
			credentials: user.credentials?.map((cred) => ({
				noskeinstance: cred.noskeinstance,
				username: cred.username,
			})),
		};
	} else if (user && user.accounttype === "admin") {
		user = null;
		try {
			user = await UserModel.findOne({
				param_username,
			});
		} catch (error) {
			setResponseStatus(event, 500, "database error");
			return `ERROR: ${error as string}`;
		}
		if (user) {
			return {
				username: user.username,
				email: user.email,
				accounttype: user.accounttype,
				credentials: user.credentials?.map((cred) => ({
					noskeinstance: cred.noskeinstance,
					username: cred.username,
				})),
			};
		} else {
			setResponseStatus(event, 404, "not found");
			return;
		}
	} else {
		setResponseStatus(event, 401, "unauthorized");
		return;
	}
});
