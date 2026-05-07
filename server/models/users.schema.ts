import { Schema, type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";

const credentialsSchema = {
	noskeinstance: { type: Schema.Types.ObjectId, ref: "noskeinstances", required: true },
	username: { type: Schema.Types.String, required: true },
	password: { type: Schema.Types.String, required: true },
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
		type: Schema.Types.String,
		enum: ["admin", "user"],
		required: true,
	},
	credentials: [credentialsSchema],
} as const;

export interface UserCredential {
	noskeinstance: Types.ObjectId;
	username: string;
	password: string;
}

export interface UserDocument {
	_id: Types.ObjectId;
	email?: string;
	username: string;
	password: string;
	accounttype: "admin" | "user";
	credentials: Array<UserCredential>;
	createdAt?: Date;
	updatedAt?: Date;
}

export const UserModel = defineMongooseModel<UserDocument>({
	name: "users",
	schema: schemaDefinition,
	options: { timestamps: true },
	hooks(schema) {
		schema.pre("save", function () {
			if (this.password && this.username) {
				return;
			}

			throw createError({
				statusCode: 500,
				statusMessage: "validation failed",
			});
		});
	},
});
