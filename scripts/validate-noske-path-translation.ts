import { resolveNoskeTargetPath, type NoskeApiVersion } from "../server/utils/noske-path.ts";

interface Case {
	version: NoskeApiVersion;
	input: string;
	expected: string;
}

const cases: Array<Case> = [
	{ version: "openapi", input: "/search/corp_info", expected: "/search/corp_info" },
	{ version: "openapi", input: "/ca/api/corpora", expected: "/ca/api/corpora" },
	{ version: "bonito", input: "/search/corp_info", expected: "/corp_info" },
	{ version: "bonito", input: "/ca/api/corpora", expected: "/corpora" },
	{
		version: "bonito",
		input: "/ca/api/corpora/123/documents",
		expected: "/corpora/123/documents",
	},
	{ version: "bonito", input: "/foo/search/corp_info", expected: "/foo/search/corp_info" },
	{ version: "bonito", input: "/search", expected: "/search" },
	{ version: "bonito", input: "/ca/api", expected: "/ca/api" },
];

for (const testCase of cases) {
	const actual = resolveNoskeTargetPath(testCase.version, testCase.input);

	if (actual !== testCase.expected) {
		throw new Error(
			`${testCase.version} ${testCase.input}: expected ${testCase.expected}, got ${actual}`,
		);
	}
}

console.log(`Validated ${String(cases.length)} NoSketch path translation cases.`);
