import { type HydratedDocument, type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	uid: { type: String, required: true }, //is unique per index statement on l52
	schemaVersion: { type: Number, required: true },
	sourceVisualization: { type: "ObjectId", ref: "visualizations", required: true },
	publisher: { type: "ObjectId", ref: "users", required: true },
	publisherUsername: { type: String, required: true },
	title: { type: String, required: true },
	description: { type: String, required: false, default: "" },
	queries: [{ type: "Mixed", required: true }],
	visualizations: [{ type: String, required: true }],
	panels: [{ type: "Mixed", required: true }],
	isPublic: { type: Boolean, required: true, default: true },
	publishedAt: { type: Date, required: true },
	hiddenAt: { type: Date, required: false },
	hiddenBy: { type: "ObjectId", ref: "users", required: false },
} as const;

export interface PublishedVisualizationSchema {
	_id: Types.ObjectId;
	uid: string;
	schemaVersion: number;
	sourceVisualization: Types.ObjectId;
	publisher: Types.ObjectId;
	publisherUsername: string;
	title: string;
	description: string;
	queries: Array<unknown>;
	visualizations: Array<string>;
	panels: Array<unknown>;
	isPublic: boolean;
	publishedAt: Date;
	hiddenAt?: Date;
	hiddenBy?: Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}

export type PublishedVisualizationDocument = HydratedDocument<PublishedVisualizationSchema> & {
	createdAt?: Date;
	updatedAt?: Date;
};

export const PublishedVisualizationModel = defineMongooseModel<PublishedVisualizationSchema>({
	name: "publishedvisualizations",
	schema: schemaDefinition,
	options: { timestamps: true },
	hooks(schema) {
		schema.index({ uid: 1 }, { unique: true });
		schema.index({ publisher: 1, publishedAt: -1 });
		schema.index({ sourceVisualization: 1, publishedAt: -1 });
	},
});
