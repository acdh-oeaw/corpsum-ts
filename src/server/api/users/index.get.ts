import { UserModel } from "@/server/models/user.schema";

export default defineEventHandler(async () => {
	return await UserModel.find().select("-password");
});
