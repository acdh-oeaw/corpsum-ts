import { type InferRawDocType, Schema } from "mongoose";

// eslint-disable-next-line import-x/no-unresolved
import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	name: { type: Schema.Types.String, required: true },
	owner: [{ type: Schema.Types.ObjectId, ref: "users", required: true }],
	noske: { type: Schema.Types.ObjectId, ref: "noskeinstances", required: true },
	corpus: { type: Schema.Types.String, required: true },
	subCorpus: { type: Schema.Types.String, required: false },
	type: {
		type: Schema.Types.String,
		enum: ["charrow", "cqlrow", "iqueryrow", "lemmarow", "phraserow", "wordrow"],
		required: true,
	},
	userInput: { type: Schema.Types.String, required: true },
	facettingValues: { type: Schema.Types.Mixed, required: true },
} as const;

export type QueryDocument = InferRawDocType<typeof schemaDefinition>;

export const QueryModel = defineMongooseModel({
	name: "queries",
	schema: schemaDefinition,
	options: { timestamps: true },
});
