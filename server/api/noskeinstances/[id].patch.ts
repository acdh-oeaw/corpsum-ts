import { defineEventHandler, getRouterParam, readBody } from "h3";
import mongoose from "mongoose";

import { type NoskeDocumentSlim, NoskeModel } from "~/server/models/noskeinstances.schema";
import { UserModel } from "~/server/models/users.schema";
import { requireAuth } from "~/server/utils/auth";

interface Owner {
	_id: string;
	username: string;
}

interface PopulatedNoskeDocument extends NoskeDocumentSlim {
	owner: Owner;
	_id: string;
}

interface NoskePayload {
	name: string;
	base: string;
	version: "openapi" | "bonito";
	authentication: "none" | "basic";
	public: boolean;
	host: string;
}

const noskeVersions = ["openapi", "bonito"] as const;
const noskeAuthTypes = ["none", "basic"] as const;
const noskeVersionSet = new Set<string>(noskeVersions);
const noskeAuthSet = new Set<string>(noskeAuthTypes);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isOwner(value: unknown): value is Owner {
	return typeof value === "object" && value !== null && "_id" in value && "username" in value;
}

function isNoskeVersion(value: unknown): value is NoskePayload["version"] {
	return typeof value === "string" && noskeVersionSet.has(value);
}

function isNoskeAuth(value: unknown): value is NoskePayload["authentication"] {
	return typeof value === "string" && noskeAuthSet.has(value);
}

export default defineEventHandler(async (event): Promise<PopulatedNoskeDocument | undefined> => {
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

	const noskeinstance = await NoskeModel.findById(id).populate<{ owner: Owner }>(
		"owner",
		"username",
	);
	if (!noskeinstance) {
		setResponseStatus(event, 404, "instance not found");
		return;
	}

	const ownsInstance = noskeinstance.owner._id.toString() === user._id.toString();
	if (!ownsInstance && String(user.accounttype) !== "admin") {
		setResponseStatus(event, 403, "forbidden");
		return;
	}

	const payload = (await readBody(event)) as unknown;
	if (!isRecord(payload)) {
		setResponseStatus(event, 400, "invalid payload");
		return;
	}

	const updates: Partial<NoskeDocumentSlim> = {};

	if (Object.prototype.hasOwnProperty.call(payload, "name")) {
		if (typeof payload.name !== "string") {
			setResponseStatus(event, 400, "invalid name");
			return;
		}
		updates.name = payload.name;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "base")) {
		if (typeof payload.base !== "string") {
			setResponseStatus(event, 400, "invalid base");
			return;
		}
		updates.base = payload.base;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "host")) {
		if (typeof payload.host !== "string") {
			setResponseStatus(event, 400, "invalid host");
			return;
		}
		updates.host = payload.host;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "public")) {
		if (typeof payload.public !== "boolean") {
			setResponseStatus(event, 400, "invalid public value");
			return;
		}
		updates.public = payload.public;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "version")) {
		if (!isNoskeVersion(payload.version)) {
			setResponseStatus(event, 400, "invalid version");
			return;
		}
		updates.version = payload.version;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "authentication")) {
		if (!isNoskeAuth(payload.authentication)) {
			setResponseStatus(event, 400, "invalid authentication");
			return;
		}
		updates.authentication = payload.authentication;
	}

	if (Object.keys(updates).length === 0) {
		setResponseStatus(event, 400, "no fields to update");
		return;
	}

	Object.assign(noskeinstance, updates);
	await noskeinstance.save();

	const owner = isOwner(noskeinstance.owner) ? noskeinstance.owner : null;
	if (!owner) {
		setResponseStatus(event, 500, "owner lookup failed");
		return;
	}

	const idValue = noskeinstance._id.toString();

	const version = isNoskeVersion(noskeinstance.version) ? noskeinstance.version : "openapi";
	const authentication = isNoskeAuth(noskeinstance.authentication)
		? noskeinstance.authentication
		: "none";

	return {
		_id: idValue,
		name: String(noskeinstance.name),
		public: Boolean(noskeinstance.public),
		base: String(noskeinstance.base),
		version,
		host: String(noskeinstance.host),
		authentication,
		owner: {
			_id: owner._id.toString(),
			username: String(owner.username),
		},
	};
});
