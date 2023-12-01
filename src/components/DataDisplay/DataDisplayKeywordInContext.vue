<script lang="ts" setup>
import { storeToRefs } from "pinia";
import type { Ref } from "vue";

import KWICDetailDialog from "./KWICDetailDialog.vue";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const headers = ref([
	// { title: "date", key: "date", type: "string" },
	// { title: "source", key: "source", type: "string" },
	// { title: "region", key: "region", type: "string" },
	{ title: "left", key: "left", type: "string" },
	{ title: "word", key: "word", type: "string" },
	{ title: "right", key: "right", type: "string" },
	{ title: "docid", key: "docid", type: "string" },
	// { title: "topic", key: "topic", type: "string" },
	{ title: "toknum", key: "toknum", type: "string" },
	{ title: "open", key: "open", type: "string" },
]);

function open(item) {
	console.log("open", { item });
	selectedKWIC.value = item;
}

const selectedKWIC: Ref<KeywordInContext | null> = ref(null);
</script>

<template>
	<VCard>
		<VCardItem title="Keyword in Context View">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				shows absolute and relative Values.
			</template>
		</VCardItem>
		<VCardText class="py-0">
			<div v-for="query of queries" :key="query.id">
				<div v-if="!query.loading.keywordInContext">
					<span :style="`color: ${query.color}`">
						{{ query.finalQuery }}
					</span>
					<VDataTable
						density="compact"
						:headers="headers"
						:items="query.data.keywordInContext"
						dense
					>
						<template #[`item.open`]="{ item }">
							<VIcon size="small" class="me-2" icon="mdi-open-in-new" @click="open(item)" />
						</template>
					</VDataTable>
					<KWICDetailDialog :kwic="selectedKWIC" @close="selectedKWIC = null" />
				</div>
				<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
			</div>
		</VCardText>

		<VDivider></VDivider>
	</VCard>
</template>
