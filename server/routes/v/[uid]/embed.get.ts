import { defineEventHandler, getRouterParam, sendRedirect } from "h3";

import { defaultLocale } from "@/config/i18n.config";

export default defineEventHandler(async (event) => {
	const uid = getRouterParam(event, "uid");

	return await sendRedirect(event, `/${defaultLocale}/v/${uid}/embed`, 302);
});
