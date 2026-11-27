<script setup lang="ts">
import Alert from "@/components/ui/alert/Alert.vue";

defineProps<{
	message?: string | null;
	retry?: () => void | Promise<void>;
	pending?: boolean;
}>();

const t = useTranslations();
</script>

<template>
	<Alert variant="destructive" class="flex flex-wrap items-center justify-between gap-2">
		<p>{{ message ?? t("FetchError.loadFailed") }}</p>
		<Button
			v-if="retry"
			type="button"
			variant="outline"
			size="sm"
			:disabled="pending"
			@click="retry()"
		>
			{{ t("FetchError.retry") }}
		</Button>
	</Alert>
</template>
