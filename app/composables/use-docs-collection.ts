export function useDocsCollection() {
	const locale = useLocale();
	return computed(() => (locale.value === "de" ? "docsDe" : "docsEn"));
}
