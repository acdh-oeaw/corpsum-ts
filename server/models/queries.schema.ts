import { Schema, type Types } from "mongoose";

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

export interface QueryDocument {
	_id: Types.ObjectId;
	name: string;
	owner: Array<Types.ObjectId>;
	noske: Types.ObjectId;
	corpus: string;
	subCorpus?: string;
	type: "charrow" | "cqlrow" | "iqueryrow" | "lemmarow" | "phraserow" | "wordrow";
	userInput: string;
	facettingValues: unknown;
	createdAt?: Date;
	updatedAt?: Date;
}

export const QueryModel = defineMongooseModel<QueryDocument>({
	name: "queries",
	schema: schemaDefinition,
	options: { timestamps: true },
});
