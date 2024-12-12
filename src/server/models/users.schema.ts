import { type  InferRawDocType, Schema } from "mongoose";

// eslint-disable-next-line import-x/no-unresolved
import { defineMongooseModel } from "#nuxt/mongoose";

const credentialsSchema = {
	noskeinstance: { type: Schema.Types.ObjectId, ref: "noskeinstances", required: true },
	username: { type: Schema.Types.String, required: true },
	password: { type: Schema.Types.String, required: true }
} as const;

const schemaDefinition = {
	_id: { type: Schema.Types.ObjectId },
	email: {
		type: Schema.Types.String,
		unique: true,
	},
	username: {
		type: Schema.Types.String,
		unique: true,
		required: true,
	},
	password: {
		type: Schema.Types.String,
		required: true,
	},
	accounttype: {
		type: Schema.Types.String, enum: ["admin", "user"], required: true
	},
	credentials: [credentialsSchema],
} as const;



export type UserDocument = InferRawDocType<typeof schemaDefinition>;

export const UserModel = defineMongooseModel({
	name: "users",
	schema: schemaDefinition,
	options: { timestamps: true },
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
