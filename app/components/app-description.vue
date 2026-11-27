<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const props = defineProps<{ name?: string }>();
const locale = useLocale();
const contentPath = computed(() => `/${locale.value}/${props.name ?? "startseite"}`);
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
