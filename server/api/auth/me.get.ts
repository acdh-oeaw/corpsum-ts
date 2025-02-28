import { type UserDocument, UserModel } from "~/server/models/users.schema";
import { requireAuth } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
	const payload = await requireAuth(event);

	let user: UserDocument | null = null;

	try {
		user = await UserModel.findOne({
			username: payload.username,
		});
	} catch (error) {
		setResponseStatus(event, 500, "database error");
		return `ERROR: ${error as string}`;
	}

	if (user)
		return {
			username: user.username,
			email: user.email,
			accounttype: user.accounttype,
		};
	else {
		setResponseStatus(event, 404, "not found");
		return;
	}
});
