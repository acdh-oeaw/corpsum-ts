import { Schema, type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";

export type AuthProvider = "github";

const schemaDefinition = {
	provider: {
		type: Schema.Types.String,
		enum: ["github"],
		required: true,
	},
	providerAccountId: {
		type: Schema.Types.String,
		required: true,
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: "users",
		required: true,
	},
	username: {
		type: Schema.Types.String,
	},
	email: {
		type: Schema.Types.String,
	},
} as const;

export interface AuthIdentityDocument {
	_id: Types.ObjectId;
	provider: AuthProvider;
	providerAccountId: string;
	user: Types.ObjectId;
	username?: string;
	email?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export const AuthIdentityModel = defineMongooseModel<AuthIdentityDocument>({
	name: "authidentities",
	schema: schemaDefinition,
	options: { timestamps: true },
	hooks(schema) {
		schema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
		schema.index({ user: 1, provider: 1 }, { unique: true });
	},
});
