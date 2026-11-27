import mongoose from "mongoose";

import type { components } from "~/lib/noske-types";
import { NoskeModel, type NoskeDocument } from "~/server/models/noskeinstances.schema";

type CorpusInfo = components["schemas"]["01_corp_info"];

export async function retrieveCorpusInfo(options: {
	noske: NoskeDocument;
	corpus: string;
	userId: string | null;
	fetch: () => Promise<CorpusInfo>;
	refresh?: boolean;
}) {
	const scope = options.userId ? new mongoose.Types.ObjectId(options.userId) : null;
	const current = await NoskeModel.findById(options.noske._id).lean<NoskeDocument>();
	const cached = current?.corpusInfoCache?.find(
		(item) => item.corpus === options.corpus && (item.user?.toString() ?? null) === options.userId,
	);
	let info: CorpusInfo;
	try {
		info = await options.fetch();
		if (!info || typeof info !== "object" || Array.isArray(info) || typeof info.name !== "string") {
			throw new Error("Invalid corpus info response");
		}
	} catch (error) {
		const status =
			typeof error === "object" && error !== null && "statusCode" in error
				? Number(error.statusCode)
				: undefined;
		if (cached && (status === 401 || status === 403 || status === 404)) {
			await NoskeModel.updateOne(
				{ _id: options.noske._id, base: options.noske.base },
				{ $pull: { corpusInfoCache: { corpus: options.corpus, user: scope } } },
			);
		}
		if (cached && !(status && status >= 400 && status < 500)) {
			return { info: cached.info, status: "stale" as const };
		}
		throw error;
	}
	const compiled =
		typeof info.compiled === "string" &&
		/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(info.compiled)
			? info.compiled
			: null;
	if (!options.refresh && compiled && cached?.compiled === compiled) {
		return { info: cached.info, status: "hit" as const };
	}
	const record = { corpus: options.corpus, info, compiled, cachedAt: new Date(), user: scope };
	await NoskeModel.collection.updateOne(
		{
			_id: options.noske._id,
			base: options.noske.base,
			version: options.noske.version,
			authentication: options.noske.authentication,
		},
		[
			{
				$set: {
					corpusInfoCache: {
						$concatArrays: [
							{
								$filter: {
									input: { $ifNull: ["$corpusInfoCache", []] },
									as: "entry",
									cond: {
										$not: {
											$and: [
												{ $eq: ["$$entry.corpus", options.corpus] },
												{ $eq: [{ $ifNull: ["$$entry.user", null] }, scope] },
											],
										},
									},
								},
							},
							[{ $literal: record }],
						],
					},
				},
			},
		],
	);
	return { info, status: cached ? ("refresh" as const) : ("miss" as const) };
}
