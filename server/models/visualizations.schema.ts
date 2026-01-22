import { type InferRawDocType, Schema } from "mongoose";

// eslint-disable-next-line import-x/no-unresolved
import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	queries: [{ type: Schema.Types.ObjectId, ref: "queries", required: true }],
	visualizations: [
		{
			type: Schema.Types.String,
			enum: [
				"data-display-collocations",
				"data-display-keyword-in-context",
				"data-display-media-source",
				"data-display-regional-frequencies",
				"data-display-source-table",
				"data-display-word-form-frequencies",
				"data-display-yearly-frequencies",
			],
			required: true,
		},
	],
	name: { type: Schema.Types.String, required: true },
	settings: [{ type: Schema.Types.Mixed, required: true }],
	data: [{ type: Schema.Types.Mixed, required: true }],
} as const;

export type VisualizationDocument = InferRawDocType<typeof schemaDefinition>;

export const VisualizationModel = defineMongooseModel({
	name: "visualizations",
	schema: schemaDefinition,
	options: { timestamps: true },
});
