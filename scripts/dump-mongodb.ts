import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

interface Options {
	envFile: string;
	service: string;
	outputDir: string;
	fileName?: string;
}

type Env = Record<string, string>;

function printHelp() {
	console.log(`Create a MongoDB dump through the Docker Compose MongoDB service.

Usage:
  pnpm db:dump [options]

Options:
  --env-file <path>  Environment file used by docker compose. Default: local.env
  --service <name>   MongoDB compose service. Default: corpsum-mongodb
  --output-dir <dir> Directory inside the MongoDB container. Default: /data/dumps
  --name <file>      Archive file name. Default: <database>-<timestamp>.archive.gz
  --help             Show this help text
`);
}

function parseArgs(args: Array<string>): Options {
	const options: Options = {
		envFile: "local.env",
		outputDir: "/data/dumps",
		service: "corpsum-mongodb",
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

		if (arg === "--service") {
			options.service = readValue();
			continue;
		}

		if (arg === "--output-dir") {
			options.outputDir = readValue();
			continue;
		}

		if (arg === "--name") {
			options.fileName = readValue();
			continue;
		}

		throw new Error(`Unknown option: ${arg}.`);
	}

	return options;
}

function parseEnvFile(filePath: string): Env {
	const env: Env = {};
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
		let value = trimmed.slice(separatorIndex + 1).trim();

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

function requireEnv(env: Env, key: string): string {
	const value = env[key] ?? process.env[key];
	if (value == null || value.length === 0) {
		throw new Error(`Missing required environment variable ${key}.`);
	}
	return value;
}

function getDatabaseName(databaseUrl: string): string {
	const url = new URL(databaseUrl);
	const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/u, ""));

	if (databaseName.length === 0) {
		throw new Error("DATABASE_URL must include a database name.");
	}

	return databaseName;
}

function createDefaultFileName(databaseName: string): string {
	const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
	return `${databaseName}-${timestamp}.archive.gz`;
}

function validateFileName(fileName: string): string {
	if (fileName.includes("/") || fileName.includes("\0")) {
		throw new Error("--name must be a file name, not a path.");
	}

	return fileName.endsWith(".gz") ? fileName : `${fileName}.archive.gz`;
}

function trimTrailingSlash(value: string): string {
	return value.replace(/\/+$/u, "");
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	const envFilePath = resolve(options.envFile);
	const env = parseEnvFile(envFilePath);
	const databaseName = getDatabaseName(requireEnv(env, "DATABASE_URL"));
	const fileName = validateFileName(options.fileName ?? createDefaultFileName(databaseName));
	const outputPath = `${trimTrailingSlash(options.outputDir)}/${fileName}`;
	const mongoDumpCommand = `
if [ -z "\${MONGO_INITDB_ROOT_USERNAME:-}" ] || [ -z "\${MONGO_INITDB_ROOT_PASSWORD:-}" ]; then
	echo "Missing MONGO_INITDB_ROOT_USERNAME or MONGO_INITDB_ROOT_PASSWORD in the MongoDB container." >&2
	exit 1
fi

mongodump \\
	--username "$MONGO_INITDB_ROOT_USERNAME" \\
	--password "$MONGO_INITDB_ROOT_PASSWORD" \\
	--authenticationDatabase admin \\
	--db "$MONGODB_DUMP_DATABASE" \\
	--archive="$MONGODB_DUMP_ARCHIVE" \\
	--gzip
`;

	const dockerArgs = [
		"compose",
		"--env-file",
		options.envFile,
		"exec",
		"-T",
		"--env",
		`MONGODB_DUMP_DATABASE=${databaseName}`,
		"--env",
		`MONGODB_DUMP_ARCHIVE=${outputPath}`,
		options.service,
		"sh",
		"-ceu",
		mongoDumpCommand,
	];

	console.log(`Creating MongoDB dump for database "${databaseName}"...`);
	console.log(`Container output: ${outputPath}`);

	const result = spawnSync("docker", dockerArgs, {
		stdio: "inherit",
	});

	if (result.error != null) {
		throw result.error;
	}

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	const hostOutputDir = env.DOCKER_MONGODUMPS_DIR ?? process.env.DOCKER_MONGODUMPS_DIR;
	if (hostOutputDir != null && hostOutputDir.length > 0) {
		const hostOutputLabel = existsSync(hostOutputDir) ? "Host output" : "Configured host output";
		console.log(`${hostOutputLabel}: ${hostOutputDir}/${fileName}`);
	}

	console.log("MongoDB dump completed.");
}

try {
	main();
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
}
