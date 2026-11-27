import * as v from "valibot";

const httpUrl = v.pipe(v.string(), v.url(), v.regex(/^[Hh][Tt][Tt][Pp][Ss]?:\/\//));
const secret = v.pipe(v.string(), v.minLength(32));
const optionalText = v.optional(v.string(), "");

export const publicRuntimeConfigSchema = v.object({
	appBaseUrl: httpUrl,
	redmineId: v.pipe(v.string(), v.regex(/^[1-9][0-9]*$/)),
	bots: v.optional(v.picklist(["disabled", "enabled"]), "disabled"),
	googleSiteVerification: optionalText,
	matomoBaseUrl: v.optional(v.union([v.literal(""), httpUrl]), ""),
	matomoId: optionalText,
});

export const runtimeConfigSchema = v.object({
	authSecret: secret,
	credentialSecret: v.optional(v.union([v.literal(""), secret]), ""),
	jwtExpiration: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
	oauth: v.object({
		github: v.object({ clientId: optionalText, clientSecret: optionalText }),
	}),
	public: publicRuntimeConfigSchema,
});
