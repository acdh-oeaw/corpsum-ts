import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface Options {
	envFile: string;
	repo: string;
	environment: string;
	dryRun: boolean;
}

interface EnvEntry {
	key: string;
	value: string;
}

interface SyncEntry extends EnvEntry {
	targetKey: string;
	type: "secret" | "variable";
}

const ignoredNames = new Set(["MONGO_ROOT_USER", "MONGO_ROOT_PASSWORD"]);

const githubNameMap: Record<string, string> = {
	BOTS: "NUXT_PUBLIC_BOTS",
	DATABASE_URL: "K8S_SECRET_DATABASE_URL",
	NUXT_AUTH_SECRET: "K8S_SECRET_NUXT_AUTH_SECRET",
	NUXT_CREDENTIAL_SECRET: "K8S_SECRET_NUXT_CREDENTIAL_SECRET",
	NUXT_JWT_EXPIRATION: "K8S_SECRET_NUXT_JWT_EXPIRATION",
	NUXT_OAUTH_GITHUB_CLIENT_ID: "K8S_SECRET_NUXT_OAUTH_GITHUB_CLIENT_ID",
	NUXT_OAUTH_GITHUB_CLIENT_SECRET: "K8S_SECRET_NUXT_OAUTH_GITHUB_CLIENT_SECRET",
	NUXT_PUBLIC_APP_BASE_URL: "K8S_SECRET_NUXT_PUBLIC_APP_BASE_URL",
	NUXT_PUBLIC_MATOMO_BASE_URL: "K8S_SECRET_NUXT_PUBLIC_MATOMO_BASE_URL",
};

const secretNames = new Set([
	"K8S_SECRET_DATABASE_URL",
	"K8S_SECRET_NUXT_AUTH_SECRET",
	"K8S_SECRET_NUXT_CREDENTIAL_SECRET",
	"K8S_SECRET_NUXT_JWT_EXPIRATION",
	"K8S_SECRET_NUXT_OAUTH_GITHUB_CLIENT_SECRET",
]);

function printHelp() {
	console.log(`Sync a dotenv file to a GitHub repository environment.

Usage:
  pnpm github:env:sync [options]

Options:
  --env-file <path>    Dotenv file to read. Default: dev.env
  --repo <owner/repo>  GitHub repository. Default: acdh-oeaw/corpsum-ts
  --env <name>         GitHub environment name. Default: review/dev
  --dry-run            Print planned updates without calling gh
  --help               Show this help text
`);
}

function parseArgs(args: Array<string>): Options {
	const options: Options = {
		dryRun: false,
		envFile: "dev.env",
		environment: "review/dev",
		repo: "acdh-oeaw/corpsum-ts",
	};

	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];

		if (arg === "--") {
			continue;
		}

		if (arg === "--help" || arg === "-h") {
			printHelp();
			process.exit(0);
		}

		if (arg === "--dry-run") {
			options.dryRun = true;
			continue;
		}

		const readValue = () => {
			const value = args[index + 1];
			if (value == null || value.startsWith("--")) {
				throw new Error(`Missing value for ${arg}.`);
			}
			index += 1;
			return value;
		};

		if (arg === "--env-file") {
			options.envFile = readValue();
			continue;
		}

		if (arg === "--repo") {
			options.repo = readValue();
			continue;
		}

		if (arg === "--env") {
			options.environment = readValue();
			continue;
		}

		throw new Error(`Unknown option: ${arg}.`);
	}

	return options;
}

function unquote(value: string): string {
	const trimmed = value.trim();
	const quote = trimmed[0];

	if ((quote === `"` || quote === `'`) && trimmed.endsWith(quote)) {
		return trimmed.slice(1, -1);
	}

	return trimmed;
}

function parseEnvFile(filePath: string): Array<EnvEntry> {
	const entries: Array<EnvEntry> = [];
	const content = readFileSync(filePath, "utf8");

	for (const line of content.split(/\r?\n/u)) {
		const trimmed = line.trim();

		if (trimmed.length === 0 || trimmed.startsWith("#")) {
			continue;
		}

		const separatorIndex = trimmed.indexOf("=");
		if (separatorIndex === -1) {
			continue;
		}

		const key = trimmed.slice(0, separatorIndex).trim();
		const value = unquote(trimmed.slice(separatorIndex + 1));

		if (!/^[A-Z_][A-Z0-9_]*$/u.test(key)) {
			throw new Error(`Invalid environment variable name: ${key}`);
		}

		entries.push({ key, value });
	}

	return entries;
}

function encodeEnvironmentName(environment: string): string {
	return environment.split("/").map(encodeURIComponent).join("%2F");
}

function toSyncEntry(entry: EnvEntry): SyncEntry {
	const targetKey = githubNameMap[entry.key] ?? entry.key;
	const type = secretNames.has(targetKey) ? "secret" : "variable";

	return { ...entry, targetKey, type };
}

function shouldSync(key: string): boolean {
	return !key.startsWith("DOCKER_") && !ignoredNames.has(key);
}

function runGh(args: Array<string>, value: string) {
	const result = spawnSync("gh", args, {
		encoding: "utf8",
		input: value,
		stdio: ["pipe", "inherit", "inherit"],
	});

	if (result.error != null) {
		throw result.error;
	}

	if (result.status !== 0) {
		throw new Error(`gh ${args.join(" ")} failed with exit code ${String(result.status)}.`);
	}
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	const envFilePath = resolve(options.envFile);
	const entries = parseEnvFile(envFilePath)
		.filter((entry) => shouldSync(entry.key))
		.map(toSyncEntry);
	const encodedEnvironment = encodeEnvironmentName(options.environment);
	const variables = entries.filter((entry) => entry.type === "variable");
	const secrets = entries.filter((entry) => entry.type === "secret");

	console.log(`Repository: ${options.repo}`);
	console.log(`Environment: ${options.environment}`);
	console.log(`Environment file: ${envFilePath}`);
	console.log(`Variables: ${variables.map((entry) => entry.targetKey).join(", ") || "(none)"}`);
	console.log(`Secrets: ${secrets.map((entry) => entry.targetKey).join(", ") || "(none)"}`);

	if (options.dryRun) {
		console.log("Dry run only. No GitHub values were updated.");
		return;
	}

	for (const entry of variables) {
		console.log(`Setting variable ${entry.targetKey}...`);
		runGh(
			["variable", "set", entry.targetKey, "--repo", options.repo, "--env", encodedEnvironment],
			entry.value,
		);
	}

	for (const entry of secrets) {
		console.log(`Setting secret ${entry.targetKey}...`);
		runGh(
			["secret", "set", entry.targetKey, "--repo", options.repo, "--env", encodedEnvironment],
			entry.value,
		);
	}

	console.log("GitHub environment sync completed.");
}

try {
	main();
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
