import type { InferRawDocType } from "mongoose";

// eslint-disable-next-line import-x/no-unresolved
import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	username: {
		type: "string",
		unique: true,
		required: true,
	},
	password: {
		type: "string",
		required: true,
	},
	basicAuthString : {
		type: "string",
	},
} as const;

export type UserDocument = InferRawDocType<typeof schemaDefinition>;

export const UserModel = defineMongooseModel({
	name: "User",
	schema: schemaDefinition,
	hooks(schema) {
		schema.pre("save", function (this, next) {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (this.password && this.username) next();

			throw createError({
				statusCode: 500,
				statusMessage: "validation failed",
			});
		});
	},
});
