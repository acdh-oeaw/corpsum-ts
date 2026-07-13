import { isIP } from "node:net";

const allowedProtocols = new Set(["http:", "https:"]);

export function normalizeNoskeBaseUrl(value: string): string | null {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return null;
	}

	if (!allowedProtocols.has(url.protocol)) return null;
	if (url.username || url.password) return null;
	if (isBlockedHost(url.hostname)) return null;

	url.hash = "";
	url.search = "";
	return url.toString();
}

function isBlockedHost(hostname: string): boolean {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

	if (host === "localhost" || host.endsWith(".localhost")) return true;

	const ipVersion = isIP(host);
	if (ipVersion === 4) return isBlockedIpv4(host);
	if (ipVersion === 6) return isBlockedIpv6(host);

	return false;
}

function isBlockedIpv4(host: string): boolean {
	const parts = host.split(".").map((part) => Number.parseInt(part, 10));
	const [first, second] = parts;

	if (first === 10) return true;
	if (first === 127) return true;
	if (first === 169 && second === 254) return true;
	if (first === 172 && second !== undefined && second >= 16 && second <= 31) return true;
	if (first === 192 && second === 168) return true;

	return false;
}

function isBlockedIpv6(host: string): boolean {
	if (host === "::1") return true;

	const normalized = host.toLowerCase();
	return (
		normalized.startsWith("fc") ||
		normalized.startsWith("fd") ||
		normalized.startsWith("fe8") ||
		normalized.startsWith("fe9") ||
		normalized.startsWith("fea") ||
		normalized.startsWith("feb")
	);
}
