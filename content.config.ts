import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
	collections: {
		docsEn: defineCollection({
			type: "page",
			source: { include: "docs/en/**/*", prefix: "/en/docs" },
			schema: z.object({ navigationOrder: z.number().default(1000) }),
		}),
		docsDe: defineCollection({
			type: "page",
			source: { include: "docs/de/**/*", prefix: "/de/docs" },
			schema: z.object({ navigationOrder: z.number().default(1000) }),
		}),
		appEn: defineCollection({
			type: "page",
			source: { include: "app/en/**/*.md", prefix: "/en" },
		}),
		appDe: defineCollection({
			type: "page",
			source: { include: "app/de/**/*.md", prefix: "/de" },
		}),
	},
});
