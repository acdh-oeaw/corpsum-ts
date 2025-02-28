import { UserModel } from "~/server/models/users.schema";

export default defineEventHandler(async () => {
	return await UserModel.find().select(["-password", "-credentials.password"]);
});
