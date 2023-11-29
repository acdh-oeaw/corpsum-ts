<script lang="ts" setup>
import { storeToRefs } from "pinia";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const expand = ref(false);
</script>

<template>
	<VCard>
		<VCardItem title="Regional Frequencies">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				shows absolute and relative Values.
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<div v-for="query of queries" :key="query.id">
				<div v-if="!query.loading.regionalFrequencies">
					<span :style="`color: ${query.color}`">
						{{ query.finalQuery }}
					</span>
					<ClientOnly>
						<MapChart :query="query" />
					</ClientOnly>
				</div>
				<VProgressCircular v-else indeterminate></VProgressCircular>
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<div class="grid grid-cols-3 gap-2">
				<!-- {{ queries.length }} -->
				<!-- <div v-for="query of queries" :key="query.id" :style="`border: 2px solid ${query.color}`"> -->
				<div v-for="query of queries" :key="query.id">
					<div v-if="!query.loading.regionalFrequencies">
						<span :style="`color: ${query.color}`">
							{{ query.finalQuery }}
						</span>
						<VDataTable :items="query.data.regionalFrequencies" density="compact" />
					</div>
					<VProgressCircular v-else indeterminate></VProgressCircular>
				</div>
			</div>
		</VExpandTransition>

		<VDivider></VDivider>

		<VCardActions>
			<VBtn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? "Show Data" : "Hide Data" }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>
