import mongoose from "mongoose";

import {
	type NoskeDocument,
	type NoskeDocumentSlim,
	NoskeModel,
} from "~/server/models/noskeinstances.schema";
import { type AuthenticatedUser, isAdmin } from "~/server/utils/user";

export type ResolvedNoskeDocument = NoskeDocument & {
	_id: { toString: () => string };
	owner: { toString: () => string };
};

interface Owner {
	_id: string;
	username: string;
}

export type SerializedNoskeDocument = Omit<NoskeDocumentSlim, "createdAt" | "updatedAt"> & {
	owner: Owner;
	_id: string;
	createdAt: string | null;
	updatedAt: string | null;
};

interface PopulatedOwner {
	_id: { toString: () => string };
	username: unknown;
}

export function assertObjectId(id: string | undefined, label = "id"): string {
	if (!id || !mongoose.isValidObjectId(id)) {
		throw createError({
			statusCode: 400,
			statusMessage: `invalid ${label}`,
		});
	}

	return id;
}

export function canReadNoske(user: AuthenticatedUser, noske: ResolvedNoskeDocument): boolean {
	return Boolean(noske.public) || canMutateNoske(user, noske);
}

export function canMutateNoske(user: AuthenticatedUser, noske: ResolvedNoskeDocument): boolean {
	return noske.owner.toString() === user._id.toString() || isAdmin(user);
}

export async function requireReadableNoske(
	id: string | undefined,
	user: AuthenticatedUser,
): Promise<ResolvedNoskeDocument> {
	const noske = await NoskeModel.findById<ResolvedNoskeDocument>(assertObjectId(id, "instance id"));

	if (!noske) {
		throw createError({
			statusCode: 404,
			statusMessage: "instance not found",
		});
	}

	if (!canReadNoske(user, noske)) {
		throw createError({
			statusCode: 403,
			statusMessage: "forbidden",
		});
	}

	return noske;
}

export function serializeNoskeDocument(
	record: Omit<NoskeDocument, "owner"> & { owner: PopulatedOwner },
) {
	return {
		_id: record._id.toString(),
		name: String(record.name),
		public: Boolean(record.public),
		base: String(record.base),
		version: record.version === "bonito" ? "bonito" : "openapi",
		host: String(record.host),
		authentication: record.authentication === "basic" ? "basic" : "none",
		createdAt: record.createdAt ? record.createdAt.toISOString() : null,
		updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
		owner: {
			_id: record.owner._id.toString(),
			username: String(record.owner.username),
		},
	} satisfies SerializedNoskeDocument;
}
