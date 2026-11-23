<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const props = defineProps<{ name?: string }>();
const locale = useLocale();
const contentPath = computed(() => {
	const name = props.name ?? (locale.value === "de" ? "startseite" : "");
	return name ? `/${locale.value}/${name}` : `/${locale.value}`;
});
const { data: description } = useAsyncData(
	computed(() => `app-description:${contentPath.value}`),
	() =>
		queryCollection(locale.value === "de" ? "appDe" : "appEn")
			.path(contentPath.value)
			.first(),
);
</script>

<template>
	<ContentRenderer v-if="description" v-bind="$attrs" class="space-y-3" :value="description" />
	<slot v-else />
</template>
