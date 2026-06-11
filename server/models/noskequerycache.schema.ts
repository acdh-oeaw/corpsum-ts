import { type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";

const schemaDefinition = {
	user: { type: "ObjectId", ref: "users", required: true },
	noske: { type: "ObjectId", ref: "noskeinstances", required: true },
	cacheKey: { type: String, required: true },
	method: { type: String, required: true },
	path: { type: String, required: true },
	params: { type: "Mixed", required: false },
	body: { type: "Mixed", required: false },
	data: { type: "Mixed", required: true },
	fetchedAt: { type: Date, required: true },
	cachedAt: { type: Date, required: true },
	upstreamDurationMs: { type: Number, required: true },
	hitCount: { type: Number, required: true, default: 0 },
} as const;

export interface NoskeQueryCacheDocument {
	_id: Types.ObjectId;
	user: Types.ObjectId;
	noske: Types.ObjectId;
	cacheKey: string;
	method: string;
	path: string;
	params?: unknown;
	body?: unknown;
	data: unknown;
	fetchedAt: Date;
	cachedAt: Date;
	upstreamDurationMs: number;
	hitCount: number;
	createdAt?: Date;
	updatedAt?: Date;
}

export const NoskeQueryCacheModel = defineMongooseModel<NoskeQueryCacheDocument>({
	name: "noskequerycache",
	schema: schemaDefinition,
	options: { timestamps: true },
	hooks(schema) {
		schema.index({ user: 1, noske: 1, cacheKey: 1 }, { unique: true });
	},
});
