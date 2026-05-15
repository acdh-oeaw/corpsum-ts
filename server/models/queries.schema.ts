import { type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	name: { type: String, required: true },
	owner: [{ type: "ObjectId", ref: "users", required: true }],
	noske: { type: "ObjectId", ref: "noskeinstances", required: true },
	corpus: { type: String, required: true },
	subCorpus: { type: String, required: false },
	type: {
		type: String,
		enum: ["charrow", "cqlrow", "iqueryrow", "lemmarow", "phraserow", "wordrow"],
		required: true,
	},
	userInput: { type: String, required: true },
	facettingValues: { type: "Mixed", required: true },
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
