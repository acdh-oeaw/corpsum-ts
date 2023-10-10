<script lang="ts" setup>
import { storeToRefs } from "pinia";
// import { VDataTable } from "vuetify/labs/VDataTable";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const expand = ref(false);
</script>

<template>
	<v-card>
		<v-card-item title="Regional Frequencies">
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
					<div v-if="!query.loading.regionalFrequencies">
						<span>{{ query.finalQuery }}</span>
						<!-- <v-data-table :data="query.data.regionalFrequencies" dense /> -->
						{{ query.data.regionalFrequencies }}
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
