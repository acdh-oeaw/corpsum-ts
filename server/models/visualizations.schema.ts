import { type HydratedDocument, type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";
import { visualizationTypes } from "~/lib/visualization-types";

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
			enum: visualizationTypes,
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
