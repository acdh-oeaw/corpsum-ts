import { registerHooks } from "node:module";

import { expect, test } from "@playwright/experimental-ct-vue";

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (specifier === "#nuxt/mongoose") {
			return {
				shortCircuit: true,
				url: new URL("../../fixtures/nuxt-mongoose.mjs", import.meta.url).href,
			};
		}
		return nextResolve(specifier, context);
	},
});

let createNoskeCacheIdentity: typeof import("~/server/utils/noske-query-cache").createNoskeCacheIdentity;
let NoskeModel: typeof import("~/server/models/noskeinstances.schema").NoskeModel;
let NoskeQueryCacheModel: typeof import("~/server/models/noskequerycache.schema").NoskeQueryCacheModel;
let QueryModel: typeof import("~/server/models/queries.schema").QueryModel;
let createPublishedSnapshot: typeof import("~/server/utils/published-visualizations").createPublishedSnapshot;

const ids = {
	noske: "64b000000000000000000001",
	otherUser: "64b000000000000000000003",
	owner: "64b000000000000000000002",
	query: "64b000000000000000000004",
};

const objectId = (value: string) => ({ toString: () => value });

const corpusInfo = {
	attributes: [{ name: "word" }, { name: "lemma" }],
	structs: ["doc.id", "doc.datum", "doc.region", "doc.docsrc", "doc.genre"],
};

const selectedOptions = {
	attributes: ["lemma"],
	structures: ["doc.id", "doc.datum", "doc.region", "doc.docsrc", "doc.genre"],
};

function makeQuery() {
	return {
		_id: objectId(ids.query),
		name: "Alpha query",
		owner: [objectId(ids.owner)],
		noske: objectId(ids.noske),
		corpus: "corpus-a",
		subCorpus: "sub-a",
		type: "wordrow",
		userInput: "alpha",
		facettingValues: { region: ["east"] },
	};
}

function makeNoske(
	input: {
		authentication?: "basic" | "none";
		owner?: string;
		public?: boolean;
	} = {},
) {
	return {
		_id: objectId(ids.noske),
		owner: objectId(input.owner ?? ids.owner),
		name: "NoSketch A",
		base: "https://noske.example.test",
		version: "openapi",
		authentication: input.authentication ?? "none",
		public: input.public ?? true,
		host: "noske.example.test",
	};
}

function makePublisher(
	input: {
		accounttype?: "admin" | "user";
		credentials?: Array<{
			noskeinstance: ReturnType<typeof objectId>;
			username: string;
			password: string;
		}>;
		id?: string;
	} = {},
) {
	return {
		_id: objectId(input.id ?? ids.owner),
		username: "publisher",
		accounttype: input.accounttype ?? "user",
		credentials: input.credentials ?? [],
	};
}

function makeVisualization() {
	return {
		_id: objectId("64b000000000000000000005"),
		name: "KWIC visualization",
		queries: [objectId(ids.query)],
		visualizations: ["data-display-keyword-in-context"],
		settings: [{}],
		data: [],
	};
}

type ModelWithFind = { find: (filter: unknown) => Promise<Array<unknown>> };
type CacheModel = {
	findOne: (filter: { cacheKey: string }) => Promise<Record<string, unknown> | null>;
};

function installDatabaseFakes(input: {
	noske?: ReturnType<typeof makeNoske>;
	onCacheLookup?: (cacheKey: string) => void;
}) {
	const query = makeQuery();
	const noske = input.noske ?? makeNoske();
	(QueryModel as unknown as ModelWithFind).find = async () => [query];
	(NoskeModel as unknown as ModelWithFind).find = async () => [noske];
	(NoskeQueryCacheModel as unknown as CacheModel).findOne = async ({ cacheKey }) => {
		input.onCacheLookup?.(cacheKey);
		return {
			cacheKey,
			fetchedAt: new Date("2026-07-23T10:00:00.000Z"),
			cachedAt: new Date("2026-07-23T10:00:01.000Z"),
			upstreamDurationMs: 12,
			data: { Lines: [] },
		};
	};
}

function publish(input: {
	fetchCorpusInfo?: () => Promise<typeof corpusInfo>;
	kwicQueryOptions?: Record<string, typeof selectedOptions>;
	publisher?: ReturnType<typeof makePublisher>;
}) {
	return createPublishedSnapshot({
		visualization: makeVisualization() as never,
		publisher: (input.publisher ?? makePublisher()) as never,
		title: "Published KWIC",
		description: "",
		kwicQueryOptions: input.kwicQueryOptions ?? { [ids.query]: selectedOptions },
		fetchCorpusInfo: input.fetchCorpusInfo,
	});
}

test.describe("published KWIC server boundary", () => {
	test.beforeAll(async () => {
		const [cache, noskes, cachedQueries, queries, published] = await Promise.all([
			import("~/server/utils/noske-query-cache"),
			import("~/server/models/noskeinstances.schema"),
			import("~/server/models/noskequerycache.schema"),
			import("~/server/models/queries.schema"),
			import("~/server/utils/published-visualizations"),
		]);
		createNoskeCacheIdentity = cache.createNoskeCacheIdentity;
		NoskeModel = noskes.NoskeModel;
		NoskeQueryCacheModel = cachedQueries.NoskeQueryCacheModel;
		QueryModel = queries.QueryModel;
		createPublishedSnapshot = published.createPublishedSnapshot;
	});

	test.beforeEach(() => {
		Object.assign(globalThis, {
			createError(input: { statusCode: number; statusMessage: string }) {
				return Object.assign(new Error(input.statusMessage), input);
			},
		});
	});

	test("validates authoritative KWIC options before the exact server cache lookup", async () => {
		const cacheKeys: Array<string> = [];
		let authorityFetches = 0;
		installDatabaseFakes({ onCacheLookup: (cacheKey) => cacheKeys.push(cacheKey) });

		const snapshot = await publish({
			async fetchCorpusInfo() {
				authorityFetches += 1;
				return corpusInfo;
			},
		});

		const expected = createNoskeCacheIdentity({
			userId: ids.owner,
			noskeId: ids.noske,
			method: "GET",
			path: "/search/concordance",
			params: {
				corpname: "corpus-a",
				usesubcorp: "sub-a",
				viewmode: "kwic",
				attrs: "lemma",
				structs: "doc.id,doc.datum,doc.region,doc.docsrc,doc.genre",
				refs: "=doc.id,=doc.datum,=doc.region,=doc.docsrc,=doc.genre",
				pagesize: "1000",
				json: JSON.stringify({
					concordance_query: {
						queryselector: "wordrow",
						word: "alpha",
						sca_region: ["east"],
					},
				}),
				format: "json",
			},
			body: undefined,
		});

		expect(authorityFetches).toBe(1);
		expect(cacheKeys).toStrictEqual([expected.cacheKey]);
		expect(snapshot.missing).toStrictEqual([]);
		expect(snapshot.panels[0]).toMatchObject({
			queryId: ids.query,
			cacheKey: expected.cacheKey,
			data: { Lines: [] },
		});
		expect(snapshot.queries[0]).toMatchObject({
			sourceQueryId: ids.query,
			KWICAttrsStructs: selectedOptions,
		});
	});

	test("rejects an unoffered override before any server cache lookup", async () => {
		let cacheLookups = 0;
		installDatabaseFakes({ onCacheLookup: () => (cacheLookups += 1) });

		await expect(
			publish({
				fetchCorpusInfo: async () => corpusInfo,
				kwicQueryOptions: {
					[ids.query]: { ...selectedOptions, attributes: ["unoffered"] },
				},
			}),
		).rejects.toMatchObject({ statusCode: 400, statusMessage: "invalid kwic query options" });
		expect(cacheLookups).toBe(0);
	});

	for (const accessCase of [
		{ name: "public instance", noske: makeNoske({ public: true }), publisher: makePublisher() },
		{
			name: "private owned instance",
			noske: makeNoske({ public: false }),
			publisher: makePublisher(),
		},
		{
			name: "private instance for an administrator",
			noske: makeNoske({ public: false }),
			publisher: makePublisher({ accounttype: "admin", id: ids.otherUser }),
		},
	]) {
		test(`fetches authority for a readable ${accessCase.name}`, async () => {
			let authorityFetches = 0;
			installDatabaseFakes({ noske: accessCase.noske });
			await publish({
				publisher: accessCase.publisher,
				async fetchCorpusInfo() {
					authorityFetches += 1;
					return corpusInfo;
				},
			});
			expect(authorityFetches).toBe(1);
		});
	}

	test("rejects an unreadable private instance before authority or cache access", async () => {
		let authorityFetches = 0;
		let cacheLookups = 0;
		installDatabaseFakes({
			noske: makeNoske({ public: false }),
			onCacheLookup: () => (cacheLookups += 1),
		});

		await expect(
			publish({
				publisher: makePublisher({ id: ids.otherUser }),
				async fetchCorpusInfo() {
					authorityFetches += 1;
					return corpusInfo;
				},
			}),
		).rejects.toMatchObject({ statusCode: 403, statusMessage: "forbidden" });
		expect(authorityFetches).toBe(0);
		expect(cacheLookups).toBe(0);
	});

	test("uses the publisher Basic credentials for authoritative corpus info", async () => {
		const noske = makeNoske({ authentication: "basic" });
		installDatabaseFakes({ noske });
		const upstreamRequests: Array<{ input: string; options: Record<string, unknown> }> = [];
		Object.assign(globalThis, {
			$fetch: async (input: string, options: Record<string, unknown>) => {
				upstreamRequests.push({ input, options });
				return corpusInfo;
			},
		});

		await publish({
			publisher: makePublisher({
				credentials: [
					{ noskeinstance: objectId(ids.noske), username: "alice", password: "secret" },
				],
			}),
		});

		expect(upstreamRequests).toStrictEqual([
			{
				input: "/search/corp_info",
				options: {
					baseURL: "https://noske.example.test",
					method: "GET",
					headers: { Authorization: `Basic ${btoa("alice:secret")}` },
					params: { corpname: "corpus-a" },
				},
			},
		]);
	});

	test("rejects missing Basic credentials before upstream or cache access", async () => {
		let upstreamRequests = 0;
		let cacheLookups = 0;
		installDatabaseFakes({
			noske: makeNoske({ authentication: "basic" }),
			onCacheLookup: () => (cacheLookups += 1),
		});
		Object.assign(globalThis, {
			$fetch: async () => {
				upstreamRequests += 1;
				return corpusInfo;
			},
		});

		await expect(publish({})).rejects.toMatchObject({
			statusCode: 401,
			statusMessage: "No credentials configured for this NoSketch instance",
		});
		expect(upstreamRequests).toBe(0);
		expect(cacheLookups).toBe(0);
	});
});
