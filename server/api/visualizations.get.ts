/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { defineEventHandler } from "h3";

import { QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
import {
	type VisualizationDocument,
	VisualizationModel,
} from "~/server/models/visualizations.schema";
import { requireAuth } from "~/server/utils/auth";

const visualizationTypes = [
	"data-display-collocations",
	"data-display-keyword-in-context",
	"data-display-media-source",
	"data-display-media-type",
	"data-display-regional-frequencies",
	"data-display-source-table",
	"data-display-word-form-frequencies",
	"data-display-yearly-frequencies",
] as const;

type VisualizationType = (typeof visualizationTypes)[number];
const visualizationTypeSet = new Set<string>(visualizationTypes);

export interface VisualizationListItem {
	_id: string;
	name: string;
	queries: Array<string>;
	visualizations: Array<VisualizationType>;
	settings: Array<unknown>;
	data: Array<unknown>;
	createdAt: string | null;
	updatedAt: string | null;
}

function toVisualizationType(value: unknown): VisualizationType {
	return visualizationTypeSet.has(String(value))
		? (value as VisualizationType)
		: "data-display-keyword-in-context";
}

function toResponse(record: VisualizationDocument): VisualizationListItem {
	return {
		_id: record._id.toString(),
		name: record.name satisfies string,
		queries: record.queries.map((queryId) => queryId.toString()),
		visualizations: record.visualizations.map((value) => toVisualizationType(value)),
		settings: [...record.settings],
		data: [...record.data],
		createdAt: record.createdAt ? record.createdAt.toISOString() : null,
		updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
	};
}

export default defineEventHandler(
	async (event): Promise<Array<VisualizationListItem> | undefined> => {
		const { username } = await requireAuth(event);

		const user = await UserModel.findOne({ username });
		if (!user) {
			setResponseStatus(event, 500, "authentication error");
			return;
		}

		if ((user.accounttype satisfies string) === "admin") {
			const visualizations = (await VisualizationModel.find({})) as Array<VisualizationDocument>;
			return visualizations.map((record) => toResponse(record));
		}

		const ownedQueryIds = await QueryModel.find({ owner: user._id }).distinct("_id");
		if (ownedQueryIds.length === 0) {
			return [];
		}

		const filter = {
			queries: { $not: { $elemMatch: { $nin: ownedQueryIds } } },
		};
		const visualizations = (await VisualizationModel.find(filter)) as Array<VisualizationDocument>;
		return visualizations.map((record) => toResponse(record));
	},
);
