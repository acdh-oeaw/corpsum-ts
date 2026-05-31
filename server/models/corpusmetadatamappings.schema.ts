import { type HydratedDocument, type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";
import type {
	CorpusMetadataMappingScope,
	CorpusMetadataSemantic,
	TemporalParserConfig,
} from "~/lib/visualization-types";

const parserSchema = {
	mode: {
		type: String,
		enum: ["year", "date", "regex"],
		required: true,
	},
	pattern: { type: String, required: false },
} as const;

const schemaDefinition = {
	noske: { type: "ObjectId", ref: "noskeinstances", required: true },
	corpus: { type: String, required: true },
	semantic: {
		type: String,
		enum: ["temporal"],
		required: true,
	},
	scope: {
		type: String,
		enum: ["default", "user"],
		required: true,
	},
	owner: { type: "ObjectId", ref: "users", required: false },
	attribute: { type: String, required: true },
	parser: { type: parserSchema, required: true },
	valueMap: { type: Object, required: true },
	label: { type: String, required: false },
	description: { type: String, required: false },
} as const;

export interface CorpusMetadataMappingSchema {
	_id: Types.ObjectId;
	noske: Types.ObjectId;
	corpus: string;
	semantic: CorpusMetadataSemantic;
	scope: CorpusMetadataMappingScope;
	owner?: Types.ObjectId;
	attribute: string;
	parser: TemporalParserConfig;
	valueMap: Record<string, string>;
	label?: string;
	description?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export type CorpusMetadataMappingDocument = HydratedDocument<CorpusMetadataMappingSchema>;

export const CorpusMetadataMappingModel = defineMongooseModel<CorpusMetadataMappingSchema>({
	name: "corpusmetadatamappings",
	schema: schemaDefinition,
	options: { timestamps: true },
	hooks(schema) {
		schema.index(
			{ noske: 1, corpus: 1, semantic: 1, scope: 1 },
			{
				unique: true,
				partialFilterExpression: { scope: "default" },
			},
		);
		schema.index(
			{ noske: 1, corpus: 1, semantic: 1, scope: 1, owner: 1 },
			{
				unique: true,
				partialFilterExpression: { scope: "user" },
			},
		);
	},
});
