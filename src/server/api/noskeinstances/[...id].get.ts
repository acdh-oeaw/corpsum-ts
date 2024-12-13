import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
	const { username } = await requireAuth(event);
	let noskeinstance: NoskeDocument | null = null;

	try {
		noskeinstance = await NoskeModel.findOne({
			owner: username,
		});
	} catch (error) {
		setResponseStatus(event, 500, "database error");
		return `ERROR: ${error as string}`;
	}

	return noskeinstance;
});
