import * as v from "valibot";

import { runtimeConfigSchema } from "~/config/runtime-config";

export default defineNitroPlugin(() => {
	if (import.meta.prerender) return;

	const result = v.safeParse(runtimeConfigSchema, useRuntimeConfig());
	if (result.success) return;

	const issues = result.issues.map((issue) => {
		const path = v.getDotPath(issue) ?? "runtimeConfig";
		const variable = path.replaceAll(".", "_").replace(/[A-Z]/g, "_$&").toUpperCase();
		return `NUXT_${variable} (${issue.type})`;
	});
	throw new Error(`Invalid runtime configuration: ${issues.join(", ")}`);
});
