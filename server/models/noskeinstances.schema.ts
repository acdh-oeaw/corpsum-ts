import { type Types } from "mongoose";

import { defineMongooseModel } from "#nuxt/mongoose";
import type { components } from "~/lib/noske-types";

export interface CachedCorpusInfo {
	corpus: string;
	info: components["schemas"]["01_corp_info"];
	compiled: string | null;
	cachedAt: Date;
	user: Types.ObjectId | null;
}

const schemaDefinition = {
	owner: { type: "ObjectId", ref: "users", required: true },
	name: { type: String, required: true },
	base: { type: String, required: true },
	version: {
		type: String,
		enum: ["openapi", "bonito"],
		required: true,
	},
	authentication: {
		type: String,
		enum: ["none", "basic"],
		required: true,
	},
	public: { type: Boolean, required: true },
	host: { type: String, required: true },
	corpusInfoCache: {
		type: [
			{
				corpus: { type: String, required: true },
				info: { type: "Mixed", required: true },
				compiled: { type: String, default: null },
				cachedAt: { type: Date, required: true },
				user: { type: "ObjectId", ref: "users", default: null },
			},
		],
		default: [],
	},
} as const;

export interface NoskeDocument {
	_id: Types.ObjectId;
	owner: Types.ObjectId;
	name: string;
	base: string;
	version: "openapi" | "bonito";
	authentication: "none" | "basic";
	public: boolean;
	host: string;
	corpusInfoCache?: Array<CachedCorpusInfo>;
	createdAt?: Date;
	updatedAt?: Date;
}
export type NoskeDocumentSlim = Omit<NoskeDocument, "_id" | "owner">;

export const NoskeModel = defineMongooseModel<NoskeDocument>({
	name: "noskeinstances",
	schema: schemaDefinition,
	options: { timestamps: true },
});
