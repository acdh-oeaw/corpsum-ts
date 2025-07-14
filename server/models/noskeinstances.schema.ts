import { type InferRawDocType, Schema } from "mongoose";

// eslint-disable-next-line import-x/no-unresolved
import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	_id: { type: Schema.Types.ObjectId },
	owner: { type: Schema.Types.ObjectId, ref: "users", required: true },
	name: { type: "string", required: true },
	base: { type: "string", required: true },
	version: {
		type: "string",
		enum: ["openapi", "bonito"],
		required: true,
	},
	authentication: {
		type: "string",
		enum: ["none", "basic"],
		required: true,
	},
	public: { type: Schema.Types.Boolean, required: true },
} as const;

export type NoskeDocument = InferRawDocType<typeof schemaDefinition>;
export type NoskeDocumentSlim = Omit<NoskeDocument, "_id" | "owner">;

export const NoskeModel = defineMongooseModel({
	name: "noskeinstances",
	schema: schemaDefinition,
	options: { timestamps: true },
});
