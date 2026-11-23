<script setup lang="ts">
const props = defineProps<{ updatedAt: string }>();
const locale = useLocale();
const formattedDate = computed(() => {
	const date = new Date(props.updatedAt);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeZone: "UTC" }).format(
		date,
	);
});
</script>

<template>
	<time v-if="formattedDate" :datetime="updatedAt">{{ formattedDate }}</time>
	<span v-else>—</span>
</template>
