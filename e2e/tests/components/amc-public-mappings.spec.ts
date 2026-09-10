import { registerHooks } from "node:module";

import { expect, test } from "@playwright/experimental-ct-vue";

import { visualizationDefinitions } from "@/lib/visualization-types";
import { getAmcTemporalDefault } from "~/server/utils/amc-metadata-defaults";

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

let resolveMapping: typeof import("~/server/utils/corpus-metadata-mappings").resolveCorpusMetadataMapping;
let ensureDefault: typeof import("~/server/utils/corpus-metadata-mappings").ensureDefaultCorpusMetadataMapping;
let model: {
	findOne: (filter: Record<string, unknown>) => Promise<unknown>;
	findOneAndUpdate: (
		filter: Record<string, unknown>,
		update: { $setOnInsert: Record<string, unknown> },
		options: Record<string, unknown>,
	) => Promise<unknown>;
};
const input = { noske: "instance", corpus: "amc_4.3x", semantic: "temporal" as const };
let records: Array<Record<string, unknown>>;

test.describe("amc public metadata mappings", () => {
	test.beforeAll(async () => {
		const mappings = await import("~/server/utils/corpus-metadata-mappings");
		resolveMapping = mappings.resolveCorpusMetadataMapping;
		ensureDefault = mappings.ensureDefaultCorpusMetadataMapping;
		model = (await import("~/server/models/corpusmetadatamappings.schema"))
			.CorpusMetadataMappingModel as unknown as typeof model;
	});

	test.beforeEach(() => {
		records = [];
		model.findOne = async (filter) =>
			records.find((record) =>
				Object.entries(filter).every(([key, value]) => record[key] === value),
			) ?? null;
		model.findOneAndUpdate = async (filter, update, options) => {
			expect(options).toMatchObject({ upsert: true, returnDocument: "after" });
			const record = { ...filter, ...update.$setOnInsert };
			records.push(record);
			return record;
		};
	});

	test("every visualization's required metadata has an AMC default", () => {
		for (const definition of Object.values(visualizationDefinitions)) {
			for (const semantic of definition.metadataSemantics) {
				expect(semantic).toBe("temporal");
				expect(getAmcTemporalDefault("amc_4.25q4LTSx")).not.toBeNull();
			}
		}
	});

	test("amc versions receive a shared default without exposing another user's mapping", async () => {
		records.push({ ...input, scope: "user", owner: "other", attribute: "private.date" });
		const first = await resolveMapping({ ...input, userId: "reader" });
		expect(first.user).toBeNull();
		expect(first.resolved).toMatchObject({
			...input,
			scope: "default",
			attribute: "doc.year",
			parser: { mode: "year", sourceUnit: "year" },
			valueMap: {},
		});
		expect(first.default).not.toHaveProperty("owner");
		const second = await resolveMapping({ ...input, userId: "another-reader" });
		expect(second.resolved).toStrictEqual(first.default);
		expect(records).toHaveLength(2);
		for (const corpus of ["amc", "amc_4.3", "amc_4.25q4LTSx", "amc_future"]) {
			expect(await ensureDefault({ ...input, corpus })).toMatchObject({ scope: "default", corpus });
		}
	});

	test("private overrides and curated shared defaults remain unchanged", async () => {
		const shared = { ...input, scope: "default", attribute: "doc.datum" };
		const privateMapping = { ...input, scope: "user", owner: "reader", attribute: "custom.date" };
		records.push(shared, privateMapping);
		const result = await resolveMapping({ ...input, userId: "reader" });
		expect(result.resolved).toStrictEqual(privateMapping);
		expect(result.default).toStrictEqual(shared);
		expect(records).toHaveLength(2);
	});

	test("unrelated corpora receive no assumed AMC mapping", async () => {
		for (const corpus of ["parlamint50_at", "amcorpus", "my_amc"]) {
			expect(await ensureDefault({ ...input, corpus })).toBeNull();
		}
		expect(records).toHaveLength(0);
	});

	test("concurrent default creation resolves the winning insert", async () => {
		const shared = { ...input, scope: "default", ...getAmcTemporalDefault(input.corpus) };
		model.findOneAndUpdate = async () => {
			records.push(shared);
			throw { code: 11000 };
		};
		expect(await ensureDefault(input)).toStrictEqual(shared);
	});

	test("database errors are propagated", async () => {
		model.findOneAndUpdate = async () => {
			throw new Error("database unavailable");
		};
		await expect(ensureDefault(input)).rejects.toThrow("database unavailable");
	});
});
