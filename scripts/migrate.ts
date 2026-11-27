import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import mongoose from "mongoose";

import { assignQueryColors } from "../app/utils/colors.ts";
import { seedAmcPublicMappings } from "./migrations/amc-public-mappings.ts";

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
	{ id: "2026-09-10-amc-public-mappings", up: seedAmcPublicMappings },
	{
		id: "2026-11-11-visualization-query-colors",
		up: async (db) => {
			const collection = db.collection("visualizations");
			for await (const record of collection.find({})) {
				const ids = (record.queries ?? []).map((id: { toString(): string }) => id.toString());
				const queryColors = assignQueryColors(ids, record.queryColors ?? {});
				await collection.updateOne({ _id: record._id }, { $set: { queryColors } });
			}
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
