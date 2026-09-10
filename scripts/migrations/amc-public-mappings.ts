import type mongoose from "mongoose";

import { getAmcTemporalDefault } from "../../server/utils/amc-metadata-defaults.ts";

export async function seedAmcPublicMappings(db: NonNullable<mongoose.Connection["db"]>) {
	const mappings = db.collection("corpusmetadatamappings");
	for (const collection of [db.collection("queries"), mappings]) {
		const corpora = collection.aggregate<{ noske: mongoose.Types.ObjectId; corpus: string }>([
			{ $match: { corpus: /^amc(?:_|$)/iu } },
			{ $group: { _id: { noske: "$noske", corpus: "$corpus" } } },
			{ $project: { _id: 0, noske: "$_id.noske", corpus: "$_id.corpus" } },
		]);
		for await (const { noske, corpus } of corpora) {
			const defaults = getAmcTemporalDefault(corpus);
			if (!noske || !defaults) continue;
			await mappings.updateOne(
				{ noske, corpus, semantic: "temporal", scope: "default" },
				{ $setOnInsert: { ...defaults, createdAt: new Date(), updatedAt: new Date() } },
				{ upsert: true },
			);
		}
	}
}
