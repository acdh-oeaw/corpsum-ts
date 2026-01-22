import { defineEventHandler } from "h3";

import { QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
import { VisualizationModel } from "~/server/models/visualizations.schema";
import { requireAuth } from "~/server/utils/auth";

const visualizationTypes = [
	"data-display-collocations",
	"data-display-keyword-in-context",
	"data-display-media-source",
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
	createdAt: string;
	updatedAt: string;
}

interface VisualizationRecord {
	_id: { toString: () => string };
	name: unknown;
	queries: ReadonlyArray<{ toString: () => string }>;
	visualizations: ReadonlyArray<unknown>;
	settings: ReadonlyArray<unknown>;
	data: ReadonlyArray<unknown>;
	createdAt: Date;
	updatedAt: Date;
}

function toVisualizationType(value: unknown): VisualizationType {
	return visualizationTypeSet.has(String(value))
		? (value as VisualizationType)
		: "data-display-keyword-in-context";
}

function toResponse(record: VisualizationRecord): VisualizationListItem {
	return {
		_id: record._id.toString(),
		name: String(record.name),
		queries: record.queries.map((queryId) => queryId.toString()),
		visualizations: record.visualizations.map((value) => toVisualizationType(value)),
		settings: [...record.settings],
		data: [...record.data],
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
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

		if (String(user.accounttype) === "admin") {
			const visualizations = await VisualizationModel.find({});
			return visualizations.map((record) => toResponse(record));
		}

		const ownedQueryIds = await QueryModel.find({ owner: user._id }).distinct("_id");
		if (ownedQueryIds.length === 0) {
			return [];
		}

		const filter = {
			queries: { $not: { $elemMatch: { $nin: ownedQueryIds } } },
		};
		const visualizations = await VisualizationModel.find(filter);
		return visualizations.map((record) => toResponse(record));
	},
);
