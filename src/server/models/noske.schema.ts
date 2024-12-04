import { type  InferRawDocType, Schema } from "mongoose";

// eslint-disable-next-line import-x/no-unresolved
import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	owner: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
	id: { type: "string", required: true },
	base: { type: "string", required: true },
	version: {
		type: "string", enum: ["openapi", "bonito"], required: true
	},
	authentication: {
		type: "string", enum: ["none", "basic"], required: true
	},
} as const;

export type NoskeDocument = InferRawDocType<typeof schemaDefinition>;

export const NoskeModel = defineMongooseModel({
	name: "Noske",
	schema: schemaDefinition,
});
