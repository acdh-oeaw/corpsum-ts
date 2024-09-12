<script lang="ts" setup>
import { storeToRefs } from "pinia";

const t = useTranslations("Corpsum");
const queryStore = useQueryStore();

const { queries } = storeToRefs(queryStore);
</script>

<template>
	<VCard>
		<VCardItem :title="t('keywordInContext')">
			<template #subtitle>
				{{ t("keywordInContextDesc") }}
			</template>
		</VCardItem>
		<VCardText class="py-0">
			<div v-for="query of queries" :key="query.id">
				<KWICQueryDisplay :query="query" />
			</div>
		</VCardText>
	</VCard>
</template>
