import { createUrl } from "@acdh-oeaw/lib";

import { locales } from "@/config/i18n.config";

const sitemapPaths = ["", "/imprint"];

export default defineEventHandler((event) => {
	const { appBaseUrl: baseUrl } = useRuntimeConfig(event).public;
	const entries = locales.flatMap((locale) =>
		sitemapPaths.map((path) => {
			const url = createUrl({ baseUrl, pathname: `/${locale}${path}` });
			return `<url>\n<loc>${url}</loc>\n</url>`;
		}),
	);

	defaultContentType(event, "application/xml");
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...entries,
		"</urlset>",
	].join("\n");
});
