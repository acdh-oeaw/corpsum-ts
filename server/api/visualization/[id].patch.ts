import { defineEventHandler, getRouterParam, type H3Event, readBody } from "h3";
import mongoose from "mongoose";

import {
	type VisualizationType,
	isVisualizationType,
	normalizeVisualizationType,
} from "@/lib/visualization-types";
import { QueryModel } from "~/server/models/queries.schema";
import { UserModel } from "~/server/models/users.schema";
import {
	type VisualizationDocument,
	VisualizationModel,
} from "~/server/models/visualizations.schema";
import { requireAuth } from "~/server/utils/auth";
const readBodySafe = readBody as (event: H3Event) => Promise<unknown>;

interface VisualizationResponse {
	_id: string;
	name: string;
	queries: Array<string>;
	visualizations: Array<VisualizationType>;
	settings: Array<unknown>;
	data: Array<unknown>;
	createdAt: string | null;
	updatedAt: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function toResponse(record: VisualizationDocument): VisualizationResponse {
	return {
		_id: record._id.toString(),
		name: record.name satisfies string,
		queries: record.queries.map((queryId) => queryId.toString()),
		visualizations: record.visualizations.map((value) => normalizeVisualizationType(value)),
		settings: [...record.settings],
		data: [...record.data],
		createdAt: record.createdAt ? record.createdAt.toISOString() : null,
		updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
	};
}

export default defineEventHandler(async (event): Promise<VisualizationResponse | undefined> => {
	const { username } = await requireAuth(event);
	const id = getRouterParam(event, "id");

	if (!id || !mongoose.isValidObjectId(id)) {
		setResponseStatus(event, 400, "invalid id");
		return;
	}

	const user = await UserModel.findOne({ username });
	if (!user) {
		setResponseStatus(event, 500, "authentication error");
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
	const visualization = (await VisualizationModel.findById(id)) as VisualizationDocument | null;
	if (!visualization) {
		setResponseStatus(event, 404, "visualization not found");
		return;
	}

	if ((user.accounttype satisfies string) !== "admin") {
		const ownedCount = await QueryModel.countDocuments({
			_id: { $in: visualization.queries },
			owner: user._id,
		});
		if (ownedCount !== visualization.queries.length) {
			setResponseStatus(event, 403, "forbidden");
			return;
		}
	}

	const payload = await readBodySafe(event);
	if (!isRecord(payload)) {
		setResponseStatus(event, 400, "invalid payload");
		return;
	}

	if (Object.prototype.hasOwnProperty.call(payload, "name")) {
		if (typeof payload.name !== "string") {
			setResponseStatus(event, 400, "invalid name");
			return;
		}
		visualization.name = payload.name;
	}

	if (Object.prototype.hasOwnProperty.call(payload, "queries")) {
		if (
			!Array.isArray(payload.queries) ||
			payload.queries.length === 0 ||
			!payload.queries.every(
				(queryId) => typeof queryId === "string" && mongoose.isValidObjectId(queryId),
			)
		) {
			setResponseStatus(event, 400, "invalid queries");
			return;
		}

		if ((user.accounttype satisfies string) !== "admin") {
			const ownedCount = await QueryModel.countDocuments({
				_id: { $in: payload.queries },
				owner: user._id,
			});
			if (ownedCount !== payload.queries.length) {
				setResponseStatus(event, 403, "forbidden");
				return;
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		visualization.queries = payload.queries;
	}

	if (Object.prototype.hasOwnProperty.call(payload, "visualizations")) {
		if (
			!Array.isArray(payload.visualizations) ||
			!payload.visualizations.every((item) => isVisualizationType(item))
		) {
			setResponseStatus(event, 400, "invalid visualizations");
			return;
		}
		visualization.visualizations = payload.visualizations;
	}

	if (Object.prototype.hasOwnProperty.call(payload, "settings")) {
		if (!Array.isArray(payload.settings)) {
			setResponseStatus(event, 400, "invalid settings");
			return;
		}
		visualization.settings = payload.settings;
	}

	if (Object.prototype.hasOwnProperty.call(payload, "data")) {
		if (!Array.isArray(payload.data)) {
			setResponseStatus(event, 400, "invalid data");
			return;
		}
		visualization.data = payload.data;
	}

	await visualization.save();

	return toResponse(visualization);
});
