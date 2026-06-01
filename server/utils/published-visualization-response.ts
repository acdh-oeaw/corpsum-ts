import { type VisualizationType, normalizeVisualizationType } from "@/lib/visualization-types";
import type { PublishedVisualizationDocument } from "~/server/models/publishedvisualizations.schema";
import type {
	PublishedPanelSnapshot,
	PublishedQuerySnapshot,
} from "~/server/utils/published-visualizations";

export interface PublishedVisualizationResponse {
	uid: string;
	schemaVersion: number;
	sourceVisualization: string;
	publisherUsername: string;
	title: string;
	description: string;
	queries: Array<PublishedQuerySnapshot>;
	visualizations: Array<VisualizationType>;
	panels: Array<PublishedPanelSnapshot>;
	isPublic: boolean;
	publishedAt: string;
	hiddenAt: string | null;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface PublishedVisualizationTombstoneResponse {
	uid: string;
	isPublic: false;
	hiddenAt: string | null;
	tombstone: true;
	title: string;
}

export function toPublishedVisualizationResponse(
	record: PublishedVisualizationDocument,
): PublishedVisualizationResponse {
	return {
		uid: record.uid,
		schemaVersion: record.schemaVersion,
		sourceVisualization: record.sourceVisualization.toString(),
		publisherUsername: record.publisherUsername,
		title: record.title,
		description: record.description,
		queries: [...record.queries] as Array<PublishedQuerySnapshot>,
		visualizations: record.visualizations.map((type) => normalizeVisualizationType(type)),
		panels: [...record.panels] as Array<PublishedPanelSnapshot>,
		isPublic: record.isPublic,
		publishedAt: record.publishedAt.toISOString(),
		hiddenAt: record.hiddenAt ? record.hiddenAt.toISOString() : null,
		createdAt: record.createdAt ? record.createdAt.toISOString() : null,
		updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
	};
}

export function toPublishedVisualizationTombstoneResponse(
	record: PublishedVisualizationDocument,
): PublishedVisualizationTombstoneResponse {
	return {
		uid: record.uid,
		isPublic: false,
		hiddenAt: record.hiddenAt ? record.hiddenAt.toISOString() : null,
		tombstone: true,
		title: record.title,
	};
}
