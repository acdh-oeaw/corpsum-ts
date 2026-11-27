import { defineEventHandler } from "h3";

import {
	PublishedVisualizationModel,
	type PublishedVisualizationDocument,
} from "~/server/models/publishedvisualizations.schema";
import { toPublishedVisualizationResponse } from "~/server/utils/published-visualization-response";
import { requireUser } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
	const user = await requireUser(event);
	const filter = (user.accounttype satisfies string) === "admin" ? {} : { publisher: user._id };
	const records = (await PublishedVisualizationModel.find(filter).sort({
		publishedAt: -1,
	})) as Array<PublishedVisualizationDocument>;

	return records.map((record) => toPublishedVisualizationResponse(record));
});
