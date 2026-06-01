import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import mongoose from "mongoose";

import {
	defaultTemporalFrequencyDistributionSettings,
	legacyYearlyFrequenciesType,
	temporalFrequencyDistributionType,
} from "@/lib/visualization-types.ts";

type MongoDatabase = NonNullable<mongoose.Connection["db"]>;

interface Migration {
	id: string;
	up: (db: MongoDatabase) => Promise<void>;
}

type Env = Record<string, string>;

function parseEnvFile(path: string): Env {
	if (!existsSync(path)) return {};
	const env: Env = {};
	const content = readFileSync(path, "utf8");
	for (const line of content.split(/\r?\n/u)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const separator = trimmed.indexOf("=");
		if (separator === -1) continue;
		const key = trimmed.slice(0, separator).trim();
		let value = trimmed.slice(separator + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		env[key] = value;
	}
	return env;
}

function requireDatabaseUrl() {
	const env = parseEnvFile(resolve("local.env"));
	const value = process.env.DATABASE_URL ?? env.DATABASE_URL;
	if (!value) throw new Error("Missing DATABASE_URL.");
	return value;
}

const migrations: Array<Migration> = [
	{
		id: "20260531-rename-yearly-temporal-frequency-distribution",
		async up(db) {
			await db.collection("visualizations").updateMany(
				{ visualizations: legacyYearlyFrequenciesType },
				{
					$set: {
						"visualizations.$[item]": temporalFrequencyDistributionType,
					},
				},
				{
					arrayFilters: [{ item: legacyYearlyFrequenciesType }],
				},
			);

			const visualizations = db.collection("visualizations").find({
				visualizations: temporalFrequencyDistributionType,
			});
			for await (const visualization of visualizations) {
				const types = Array.isArray(visualization.visualizations)
					? visualization.visualizations
					: [];
				const settings = Array.isArray(visualization.settings) ? [...visualization.settings] : [];
				let changed = false;

				types.forEach((type, index) => {
					if (type !== temporalFrequencyDistributionType) return;
					const current = settings[index];
					if (typeof current === "object" && current !== null && "type" in current) return;
					settings[index] = { ...defaultTemporalFrequencyDistributionSettings };
					changed = true;
				});

				if (changed) {
					await db
						.collection("visualizations")
						.updateOne({ _id: visualization._id }, { $set: { settings } });
				}
			}

			await db.collection("publishedvisualizations").updateMany(
				{ visualizations: legacyYearlyFrequenciesType },
				{
					$set: {
						"visualizations.$[item]": temporalFrequencyDistributionType,
						schemaVersion: 2,
					},
				},
				{
					arrayFilters: [{ item: legacyYearlyFrequenciesType }],
				},
			);

			await db.collection("publishedvisualizations").updateMany(
				{ "panels.type": legacyYearlyFrequenciesType },
				{
					$set: {
						"panels.$[panel].type": temporalFrequencyDistributionType,
						"panels.$[panel].settings": defaultTemporalFrequencyDistributionSettings,
						schemaVersion: 2,
					},
				},
				{
					arrayFilters: [{ "panel.type": legacyYearlyFrequenciesType }],
				},
			);
		},
	},
];

async function main() {
	await mongoose.connect(requireDatabaseUrl());
	const db = mongoose.connection.db;
	if (!db) throw new Error("MongoDB connection is not ready.");

	const applied = db.collection("migrations");
	await applied.createIndex({ id: 1 }, { unique: true });

	for (const migration of migrations) {
		const existing = await applied.findOne({ id: migration.id });
		if (existing) {
			console.log(`Skipping ${migration.id}`);
			continue;
		}
		console.log(`Applying ${migration.id}`);
		await migration.up(db);
		await applied.insertOne({ id: migration.id, appliedAt: new Date() });
	}

	await mongoose.disconnect();
}

main().catch(async (error: unknown) => {
	console.error(error);
	await mongoose.disconnect();
	process.exit(1);
});
