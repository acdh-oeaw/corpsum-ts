import { registerHooks } from "node:module";

import { expect, test } from "@playwright/experimental-ct-vue";
import mongoose from "mongoose";

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (specifier === "#nuxt/mongoose")
			return {
				shortCircuit: true,
				url: new URL("../../fixtures/nuxt-mongoose.mjs", import.meta.url).href,
			};
		return nextResolve(specifier, context);
	},
});

const { NoskeModel } = await import("../../../server/models/noskeinstances.schema");
const { retrieveCorpusInfo } = await import("../../../server/utils/corpus-info-cache");
const id = new mongoose.Types.ObjectId();
const user = new mongoose.Types.ObjectId();
const instance = {
	_id: id,
	base: "https://example.org",
	version: "bonito",
	authentication: "none",
} as unknown as import("../../../server/models/noskeinstances.schema").NoskeDocument;

test("validates compilation dates and isolates credential-scoped cache records", async () => {
	const originalFind = NoskeModel.findById;
	const originalCollection = NoskeModel.collection;
	let entries: Array<{
		corpus: string;
		user: mongoose.Types.ObjectId | null;
		compiled: string | null;
		cachedAt: Date;
		info: { name: string; compiled?: string };
	}> = [];
	const writes: unknown[] = [];
	try {
		Object.assign(NoskeModel, {
			findById: () => ({ lean: async () => ({ corpusInfoCache: entries }) }),
			collection: {
				updateOne: async (_filter: unknown, pipeline: Array<any>) => {
					const record = pipeline[0].$set.corpusInfoCache.$concatArrays[1][0].$literal;
					entries = [
						...entries.filter(
							(item) =>
								!(item.corpus === record.corpus && String(item.user) === String(record.user)),
						),
						record,
					];
					writes.push(record);
				},
			},
		});
		const options = {
			noske: instance,
			corpus: "test",
			userId: null,
			fetch: async () => ({ name: "Public", compiled: "01/01/2025 12:00:00" }),
		};
		expect((await retrieveCorpusInfo(options)).status).toBe("miss");
		const timestamp = entries[0]!.cachedAt;
		expect((await retrieveCorpusInfo(options)).status).toBe("hit");
		expect(entries[0]!.cachedAt).toBe(timestamp);
		expect(
			(
				await retrieveCorpusInfo({
					...options,
					fetch: async () => ({ name: "Updated", compiled: "01/02/2025 12:00:00" }),
				})
			).status,
		).toBe("refresh");
		await retrieveCorpusInfo({
			...options,
			userId: user.toString(),
			fetch: async () => ({ name: "Private" }),
		});
		expect(entries).toHaveLength(2);
		expect(
			(
				await retrieveCorpusInfo({
					...options,
					fetch: async () => {
						throw Error("offline");
					},
				})
			).info.name,
		).toBe("Updated");
		expect(
			(
				await retrieveCorpusInfo({
					...options,
					userId: user.toString(),
					fetch: async () => {
						throw Error("offline");
					},
				})
			).info.name,
		).toBe("Private");
		expect(writes).toHaveLength(3);
	} finally {
		Object.assign(NoskeModel, { findById: originalFind, collection: originalCollection });
	}
});
