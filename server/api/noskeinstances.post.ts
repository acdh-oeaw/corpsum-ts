import { defineEventHandler, readBody } from "h3";

import { type NoskeDocumentSlim, NoskeModel } from "~/server/models/noskeinstances.schema";
import { normalizeNoskeBaseUrl } from "~/server/utils/noske-url";
import { requireUser } from "~/server/utils/user";

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

function isNoskeVersion(value: unknown): value is NoskePayload["version"] {
	return typeof value === "string" && noskeVersionSet.has(value);
}

function isNoskeAuth(value: unknown): value is NoskePayload["authentication"] {
	return typeof value === "string" && noskeAuthSet.has(value);
}

export default defineEventHandler(async (event): Promise<PopulatedNoskeDocument | undefined> => {
	const user = await requireUser(event);

	const payload = (await readBody(event)) as unknown;
	if (!isRecord(payload)) {
		setResponseStatus(event, 400, "invalid payload");
		return;
	}

	const { name, base, host, public: isPublic } = payload;
	if (typeof name !== "string" || typeof base !== "string" || typeof host !== "string") {
		setResponseStatus(event, 400, "required field missing");
		return;
	}

	if (typeof isPublic !== "boolean") {
		setResponseStatus(event, 400, "invalid public value");
		return;
	}

	if (!isNoskeVersion(payload.version)) {
		setResponseStatus(event, 400, "invalid version");
		return;
	}

	if (!isNoskeAuth(payload.authentication)) {
		setResponseStatus(event, 400, "invalid authentication");
		return;
	}

	const normalizedBase = normalizeNoskeBaseUrl(base);
	if (!normalizedBase) {
		setResponseStatus(event, 400, "invalid base");
		return;
	}

	const noskeinstance = await NoskeModel.create({
		name,
		base: normalizedBase,
		version: payload.version,
		authentication: payload.authentication,
		public: isPublic,
		host,
		owner: user._id,
	});

	const owner: Owner = {
		_id: user._id.toString(),
		username: user.username,
	};

	const id = (noskeinstance as { _id: { toString: () => string } })._id.toString();

	return {
		_id: id,
		name: noskeinstance.name satisfies string,
		public: noskeinstance.public satisfies boolean,
		base: noskeinstance.base satisfies string,
		version: payload.version,
		host: noskeinstance.host satisfies string,
		authentication: payload.authentication,
		owner: {
			_id: owner._id,
			username: owner.username,
		},
	};
});
