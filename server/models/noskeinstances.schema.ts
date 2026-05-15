import { type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	owner: { type: "ObjectId", ref: "users", required: true },
	name: { type: String, required: true },
	base: { type: String, required: true },
	version: {
		type: String,
		enum: ["openapi", "bonito"],
		required: true,
	},
	authentication: {
		type: String,
		enum: ["none", "basic"],
		required: true,
	},
	public: { type: Boolean, required: true },
	host: { type: String, required: true },
} as const;

export interface NoskeDocument {
	_id: Types.ObjectId;
	owner: Types.ObjectId;
	name: string;
	base: string;
	version: "openapi" | "bonito";
	authentication: "none" | "basic";
	public: boolean;
	host: string;
	createdAt?: Date;
	updatedAt?: Date;
}
export type NoskeDocumentSlim = Omit<NoskeDocument, "_id" | "owner">;

export const NoskeModel = defineMongooseModel<NoskeDocument>({
	name: "noskeinstances",
	schema: schemaDefinition,
	options: { timestamps: true },
});
