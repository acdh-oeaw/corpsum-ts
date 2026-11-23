import { defineCollection, defineContentConfig } from "@nuxt/content";

export default defineContentConfig({
	collections: {
		docsEn: defineCollection({
			type: "page",
			source: { include: "docs/en/**/*", prefix: "/en/docs" },
		}),
		docsDe: defineCollection({
			type: "page",
			source: { include: "docs/de/**/*", prefix: "/de/docs" },
		}),
		homeEn: defineCollection({
			type: "page",
			source: { include: "app/en/**/*.md", prefix: "/en" },
		}),
		homeDe: defineCollection({
			type: "page",
			source: { include: "app/de/**/*.md", prefix: "/de" },
		}),
	},
});
