import { UserModel } from "@/server/models/users.schema.ts";

export default defineEventHandler(async () => {
	return await UserModel.find().select("-password");
});
