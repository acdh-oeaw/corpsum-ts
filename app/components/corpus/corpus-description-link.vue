<script setup lang="ts">
const props = defineProps<{
	corpus: string;
	noskeId: string;
	baseUrl: string;
}>();

const t = useTranslations();
const target = useTemplateRef<HTMLElement>("target");
const visible = ref(false);
const descriptors = computed<Array<NoskeCorpusInfoQueryDescriptor>>(() =>
	visible.value && props.corpus
		? [
				{
					queryKey: ["corpus-description", props.noskeId, props.corpus],
					noske: props.noskeId,
					corpus: props.corpus,
				},
			]
		: [],
);
const results = useNoskeCorpusInfoQueries(descriptors);
const descriptionUrl = computed(() => {
	const href = results.value[0]?.data?.infohref?.trim();
	if (!href) return null;
	try {
		const url = new URL(href, props.baseUrl);
		return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
	} catch {
		return null;
	}
});

onMounted(() => {
	if (!target.value) return;
	if (typeof IntersectionObserver === "undefined") {
		visible.value = true;
		return;
	}
	const observer = new IntersectionObserver((entries) => {
		if (entries.some((entry) => entry.isIntersecting)) {
			visible.value = true;
			observer.disconnect();
		}
	});
	observer.observe(target.value);
	onUnmounted(() => observer.disconnect());
});
</script>

<template>
	<span ref="target">
		<a
			v-if="descriptionUrl"
			:href="descriptionUrl"
			target="_blank"
			rel="noopener noreferrer"
			class="text-primary underline underline-offset-4"
		>
			{{ t("NoskeInstanceDetail.viewDescription") }}
		</a>
		<span v-else-if="results[0]?.isPending">…</span>
		<span v-else>—</span>
	</span>
</template>
