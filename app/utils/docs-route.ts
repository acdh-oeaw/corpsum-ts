export function docsRoute(path = "/docs") {
	const [pathname = "/docs", hash] = path.split("#", 2);
	return {
		name: "docs-slug" as const,
		params: {
			slug: pathname
				.replace(/^\/(?:en|de)(?=\/)/, "")
				.split("/")
				.slice(2),
		},
		hash: hash ? "#" + hash : undefined,
	};
}
