import { defineEventHandler, getRouterParam, type H3Event, readBody } from "h3";
import mongoose from "mongoose";

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
const readBodySafe = readBody as (event: H3Event) => Promise<unknown>;

interface VisualizationResponse {
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isVisualizationType(value: unknown): value is VisualizationType {
	return typeof value === "string" && visualizationTypeSet.has(value);
}

function toVisualizationType(value: unknown): VisualizationType {
	return visualizationTypeSet.has(String(value))
		? (value as VisualizationType)
		: "data-display-keyword-in-context";
}

function toResponse(record: VisualizationRecord): VisualizationResponse {
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

	const visualization = await VisualizationModel.findById(id);
	if (!visualization) {
		setResponseStatus(event, 404, "visualization not found");
		return;
	}

	if (String(user.accounttype) !== "admin") {
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

		if (String(user.accounttype) !== "admin") {
			const ownedCount = await QueryModel.countDocuments({
				_id: { $in: payload.queries },
				owner: user._id,
			});
			if (ownedCount !== payload.queries.length) {
				setResponseStatus(event, 403, "forbidden");
				return;
			}
		}

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
