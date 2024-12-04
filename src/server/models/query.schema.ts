import { type  InferRawDocType, Schema } from "mongoose";

// eslint-disable-next-line import-x/no-unresolved
import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	id: { type: "string", required: true },
	owner: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
	noske: { type: Schema.Types.ObjectId, ref: "Noske", required: true },
	corpus: { type: "string", required: true },
	subCorpus: { type: "string", required: true },
	type: { type: "string", enum: ["charrow" , "cqlrow" , "iqueryrow" , "lemmarow" , "phraserow" , "wordrow"], required: true },
	userInput: { type: "string", required: true },
	facettingValues: { type: Schema.Types.Mixed, required: true },
} as const;

export type QueryDocument = InferRawDocType<typeof schemaDefinition>;

export const QueryModel = defineMongooseModel({
	name: "Query",
	schema: schemaDefinition,
});
