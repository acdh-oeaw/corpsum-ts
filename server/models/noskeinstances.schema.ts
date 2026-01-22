import { type InferRawDocType, Schema, type Types } from "mongoose";

// eslint-disable-next-line import-x/no-unresolved
import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	owner: { type: Schema.Types.ObjectId, ref: "users", required: true },
	name: { type: Schema.Types.String, required: true },
	base: { type: Schema.Types.String, required: true },
	version: {
		type: Schema.Types.String,
		enum: ["openapi", "bonito"],
		required: true,
	},
	authentication: {
		type: Schema.Types.String,
		enum: ["none", "basic"],
		required: true,
	},
	public: { type: Schema.Types.Boolean, required: true },
	host: { type: Schema.Types.String, required: true },
} as const;

export type NoskeDocument = InferRawDocType<typeof schemaDefinition> & {
	_id: Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
};
export type NoskeDocumentSlim = Omit<NoskeDocument, "_id" | "owner">;

export const NoskeModel = defineMongooseModel({
	name: "noskeinstances",
	schema: schemaDefinition,
	options: { timestamps: true },
});
