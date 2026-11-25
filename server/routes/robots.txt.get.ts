import { createUrl } from "@acdh-oeaw/lib";
import * as v from "valibot";

export default defineEventHandler((event) => {
	const { public: publicConfig } = useRuntimeConfig(event);
	const baseUrl = v.parse(v.pipe(v.string(), v.url()), publicConfig.appBaseUrl);
	const bots = v.parse(v.optional(v.picklist(["disabled", "enabled"])), publicConfig.bots);
	const isIndexable = bots === "enabled";

	const config = isIndexable
		? {
				"User-Agent": "*",
				Allow: "/",
				Host: baseUrl,
				Sitemap: String(createUrl({ baseUrl, pathname: "sitemap.xml" })),
			}
		: {
				"User-Agent": "*",
				Disallow: "/",
				Host: baseUrl,
			};

	const robots = Object.entries(config)
		.map(([key, value]) => {
			return `${key}: ${String(value)}`;
		})
		.join("\n");

	defaultContentType(event, "text/plain");
	return robots;
});
