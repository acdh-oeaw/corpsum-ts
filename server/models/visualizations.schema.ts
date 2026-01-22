import { type HydratedDocument, Schema, type Types } from "mongoose";

// eslint-disable-next-line import-x/no-unresolved
import { defineMongooseModel } from "#nuxt/mongoose";

export interface VisualizationSchema {
	queries: Array<Types.ObjectId>;
	visualizations: Array<string>;
	name: string;
	settings: Array<unknown>;
	data: Array<unknown>;
}

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

export type VisualizationDocument = HydratedDocument<VisualizationSchema> & {
	createdAt?: Date;
	updatedAt?: Date;
};

export const VisualizationModel = defineMongooseModel({
	name: "visualizations",
	schema: schemaDefinition,
	options: { timestamps: true },
});
