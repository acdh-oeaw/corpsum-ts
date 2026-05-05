import type { H3Event } from "h3";
import type { HydratedDocument } from "mongoose";

import { type UserDocument, UserModel } from "~/server/models/users.schema";
import { requireAuth } from "~/server/utils/auth";

export type AuthenticatedUser = HydratedDocument<UserDocument> & {
	_id: { toString: () => string };
};

export async function requireUser(event: H3Event): Promise<AuthenticatedUser> {
	const { username } = await requireAuth(event);
	const user = await UserModel.findOne({ username });

	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: "Unauthorized",
		});
	}

	return user as unknown as AuthenticatedUser;
}

export function isAdmin(user: UserDocument): boolean {
	return String(user.accounttype) === "admin";
}
