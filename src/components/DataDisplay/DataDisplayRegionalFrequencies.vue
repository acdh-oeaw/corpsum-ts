<script lang="ts" setup>
import { storeToRefs } from "pinia";

import CorpusChip from "../Search/CorpusChip.vue";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);
const mode = ref("relative");

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
			<VBtnToggle v-model="mode" density="compact">
				<VBtn variant="outlined" value="absolute">Absolute</VBtn>

				<VBtn variant="outlined" value="relative">Relative</VBtn>
			</VBtnToggle>
			<div v-for="query of queries" :key="query.id">
				<div v-if="query.loading.regionalFrequencies">
					<VProgressCircular :color="query.color" indeterminate></VProgressCircular>
					<span :style="`color: ${query.color}`">
						{{ query.finalQuery }}
					</span>
					<CorpusChip :query="query" />
				</div>
			</div>
			<div v-for="query of queries" :key="query.id">
				<div v-if="!query.loading.regionalFrequencies" class="mt-1">
					<span :style="`color: ${query.color}`">
						{{ query.finalQuery }}
					</span>
					<CorpusChip :query="query" />
					<ClientOnly>
						<MapChart :query="query" :mode="mode" />
					</ClientOnly>
				</div>
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
					<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
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
