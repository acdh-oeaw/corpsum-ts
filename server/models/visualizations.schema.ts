import { type HydratedDocument, type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";

export interface VisualizationSchema {
	queries: Array<Types.ObjectId>;
	visualizations: Array<string>;
	name: string;
	settings: Array<unknown>;
	data: Array<unknown>;
}

const schemaDefinition = {
	queries: [{ type: "ObjectId", ref: "queries", required: true }],
	visualizations: [
		{
			type: String,
			enum: [
				"data-display-collocations",
				"data-display-keyword-in-context",
				"data-display-media-source",
				"data-display-media-type",
				"data-display-regional-frequencies",
				"data-display-source-table",
				"data-display-word-form-frequencies",
				"data-display-yearly-frequencies",
			],
			required: true,
		},
	],
	name: { type: String, required: true },
	settings: [{ type: "Mixed", required: true }],
	data: [{ type: "Mixed", required: true }],
} as const;

export type VisualizationDocument = HydratedDocument<VisualizationSchema> & {
	createdAt?: Date;
	updatedAt?: Date;
};

export const VisualizationModel = defineMongooseModel<VisualizationSchema>({
	name: "visualizations",
	schema: schemaDefinition,
	options: { timestamps: true },
});
