import type { Locale } from "@/config/i18n.config";

export const queryCopyNameKey = "QueryForm.copyName";

export function createCopiedQueryName(name: string, translatedName: string, locale: Locale) {
	if (translatedName !== queryCopyNameKey) {
		return translatedName;
	}
	return locale === "de" ? `Kopiert von ${name}` : `Copied from ${name}`;
}
