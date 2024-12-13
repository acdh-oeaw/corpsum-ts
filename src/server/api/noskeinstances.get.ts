import { defineEventHandler } from "h3";
import mongoose from "mongoose";

import type {UserDocument} from "@/server/models/users.schema.ts";

export default defineEventHandler(async (event) => {
	const { username } = await requireAuth(event);
	let noskeinstances: Array<NoskeDocument> = [];
	const user = await mongoose.connection.db?.collection<UserDocument>("users").findOne({ username });

	try {
		noskeinstances = await NoskeModel
			.find({
				$or: [
					{public: true},
					{owner: user!._id}
				]
		})
	} catch (error) {
		setResponseStatus(event, 500, "database error");
		return `ERROR: ${error as string}`;
	}

	return noskeinstances;
});
