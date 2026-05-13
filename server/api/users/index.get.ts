import { UserModel } from "~/server/models/users.schema";
import { isAdmin, requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);

	if (!isAdmin(user)) {
		throw createError({
			statusCode: 403,
			statusMessage: "forbidden",
		});
	}

	return await UserModel.find().select(["-password", "-credentials.password"]);
});
