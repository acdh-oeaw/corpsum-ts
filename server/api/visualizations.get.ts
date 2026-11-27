/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { defineEventHandler } from "h3";

import { type VisualizationType, normalizeVisualizationType } from "@/lib/visualization-types";
import { QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
import {
	type VisualizationDocument,
	VisualizationModel,
} from "~/server/models/visualizations.schema";
import { requireAuth } from "~/server/utils/auth";

export interface VisualizationListItem {
	_id: string;
	name: string;
	queryOwners: Array<string>;
	queries: Array<string>;
	visualizations: Array<VisualizationType>;
	settings: Array<unknown>;
	data: Array<unknown>;
	createdAt: string | null;
	updatedAt: string | null;
}

function toResponse(
	record: VisualizationDocument,
	ownersByQueryId: ReadonlyMap<string, Array<string>>,
): VisualizationListItem {
	const queries = record.queries.map((queryId) => queryId.toString());
	return {
		_id: record._id.toString(),
		name: record.name satisfies string,
		queryOwners: [...new Set(queries.flatMap((queryId) => ownersByQueryId.get(queryId) ?? []))],
		queries,
		visualizations: record.visualizations.map((value) => normalizeVisualizationType(value)),
		settings: [...record.settings],
		data: [...record.data],
		createdAt: record.createdAt ? record.createdAt.toISOString() : null,
		updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
	};
}

async function toListResponse(records: Array<VisualizationDocument>) {
	const queryIds = [...new Set(records.flatMap((record) => record.queries.map(String)))];
	if (queryIds.length === 0) {
		return records.map((record) => toResponse(record, new Map()));
	}

	const queries = await QueryModel.find({ _id: { $in: queryIds } }, { owner: 1 }).populate<{
		owner: Array<{ username: string }>;
	}>("owner", "username");
	const ownersByQueryId = new Map(
		queries.map((query) => [query._id.toString(), query.owner.map((owner) => owner.username)]),
	);
	return records.map((record) => toResponse(record, ownersByQueryId));
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
			return toListResponse(visualizations);
		}

		const ownedQueryIds = await QueryModel.find({ owner: user._id }).distinct("_id");
		if (ownedQueryIds.length === 0) {
			return [];
		}

		const filter = {
			queries: { $not: { $elemMatch: { $nin: ownedQueryIds } } },
		};
		const visualizations = (await VisualizationModel.find(filter)) as Array<VisualizationDocument>;
		return toListResponse(visualizations);
	},
);
