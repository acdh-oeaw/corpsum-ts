<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { VDataTable } from "vuetify/labs/VDataTable";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const headers = ref([
	{ title: "date", key: "date", type: "string" },
	{ title: "source", key: "source", type: "string" },
	{ title: "region", key: "region", type: "string" },
	{ title: "left", key: "left", type: "string" },
	{ title: "word", key: "word", type: "string" },
	{ title: "right", key: "right", type: "string" },
	{ title: "docid", key: "docid", type: "string" },
	{ title: "topic", key: "topic", type: "string" },
	{ title: "toknum", key: "toknum", type: "string" },
]);

const expand = ref(false);
</script>

<template>
	<v-card>
		<v-card-item title="Keyword in Context View">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				shows absolute and relative Values.
			</template>
		</v-card-item>

		<v-card-text class="py-0">
			<span>Graph goes here</span>
		</v-card-text>

		<v-expand-transition v-if="expand">
			<div>
				{{ queries.length }}
				<div v-for="query of queries" :key="query.id">
					<div v-if="!query.loading.keywordInContext">
						<span>{{ query.finalQuery }}</span>
						<v-data-table :headers="headers" :items="query.data.keywordInContext" dense />
						{{ query.data.keywordInContext }}
					</div>
					<v-progress-circular v-else indeterminate></v-progress-circular>
				</div>
			</div>
		</v-expand-transition>

		<v-divider></v-divider>

		<v-card-actions>
			<v-btn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? "Show Data" : "Hide Data" }}
			</v-btn>
		</v-card-actions>
	</v-card>
</template>
