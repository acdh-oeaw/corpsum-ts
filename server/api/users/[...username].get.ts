import { defineEventHandler } from "h3";

import { type UserDocument, UserModel } from "~/server/models/users.schema";
import { isAdmin, requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const authenticatedUser = await requireUser(event);
	const param_username = getRouterParam(event, "username");

	let user: UserDocument | null = null;

	try {
		user = await UserModel.findOne({
			username: authenticatedUser.username,
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
	} else if (isAdmin(authenticatedUser)) {
		user = null;
		try {
			user = await UserModel.findOne({
				username: param_username,
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
