export type NoskeApiVersion = "openapi" | "bonito";

type NoskePathTranslator = (path: string) => string;

export const noskePathTranslators = {
	openapi(path) {
		return path;
	},
	bonito(path) {
		return path.replace(/^\/search(?=\/)/u, "").replace(/^\/ca\/api(?=\/)/u, "");
	},
} satisfies Record<NoskeApiVersion, NoskePathTranslator>;

export function resolveNoskeTargetPath(version: NoskeApiVersion, path: string): string {
	return noskePathTranslators[version](path);
}
