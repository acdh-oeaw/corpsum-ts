import { type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";

const credentialsSchema = {
	noskeinstance: { type: "ObjectId", ref: "noskeinstances", required: true },
	username: { type: String, required: true },
	password: { type: String, required: true },
} as const;

const schemaDefinition = {
	email: {
		type: String,
		unique: true,
		sparse: true,
	},
	username: {
		type: String,
		unique: true,
		required: true,
	},
	password: {
		type: String,
	},
	accounttype: {
		type: String,
		enum: ["admin", "user"],
		required: true,
	},
	credentials: [credentialsSchema],
	settings: {
		pinnedCorpora: {
			type: [
				{
					instanceId: { type: "ObjectId", ref: "noskeinstances", required: true },
					corpus: { type: String, required: true },
					_id: false,
				},
			],
			default: [],
		},
	},
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
	password?: string;
	accounttype: "admin" | "user";
	credentials: Array<UserCredential>;
	settings?: { pinnedCorpora: Array<{ instanceId: Types.ObjectId; corpus: string }> };
	createdAt?: Date;
	updatedAt?: Date;
}

export const UserModel = defineMongooseModel<UserDocument>({
	name: "users",
	schema: schemaDefinition,
	options: { timestamps: true },
	hooks(schema) {
		schema.pre("save", function () {
			if (this.username) {
				return;
			}

			throw createError({
				statusCode: 500,
				statusMessage: "validation failed",
			});
		});
	},
});
