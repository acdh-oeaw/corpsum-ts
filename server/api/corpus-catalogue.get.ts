import { NoskeModel, type NoskeDocument } from "~/server/models/noskeinstances.schema";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	await requireUser(event);
	const instances = await NoskeModel.find(
		{ public: true },
		{ name: 1, base: 1, corpusInfoCache: 1 },
	).lean<Array<NoskeDocument>>();
	return instances
		.flatMap((instance) =>
			(instance.corpusInfoCache ?? [])
				.filter((entry) => !entry.user)
				.map((entry) => ({
					id: `${instance._id}:${entry.corpus}`,
					corpus: entry.corpus,
					language: entry.info.lang ?? "—",
					words:
						entry.info.sizes?.wordcount == null ? undefined : Number(entry.info.sizes.wordcount),
					documents:
						entry.info.sizes?.doccount == null ? undefined : Number(entry.info.sizes.doccount),
					noske: instance.name,
					noskeId: instance._id.toString(),
					baseUrl: instance.base,
					rawCorpus: {
						corpname: entry.corpus,
						language_name: entry.info.lang,
						sizes: {
							wordcount:
								entry.info.sizes?.wordcount == null
									? undefined
									: Number(entry.info.sizes.wordcount),
							doccount:
								entry.info.sizes?.doccount == null ? undefined : Number(entry.info.sizes.doccount),
						},
					},
					cachedAt: entry.cachedAt,
				})),
		)
		.sort((a, b) => new Date(b.cachedAt).getTime() - new Date(a.cachedAt).getTime());
});
