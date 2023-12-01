<script lang="ts" setup>
import { storeToRefs } from "pinia";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const expand = ref(false);
</script>

<template>
	<VCard>
		<VCardItem title="Word Form Frequencies">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				shows absolute and relative Values.
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<div v-for="query of queries" :key="query.id">
				<span :style="`color: ${query.color}`">
					{{ query.finalQuery }}
				</span>
				<HighCharts
					:options="{
						chart: {
							type: 'bar',
						},
						title: {
							text: query.userInput,
						},
						xAxis: {
							categories: query.data.wordFormFrequencies.map(({ word }) => word),
						},

						yAxis: {
							title: {
								text: 'sources',
							},
						},
						series: [
							{
								color: query.color,
								name: 'relative value',
								data: query.data.wordFormFrequencies.map(({ relative }) => relative),
							},
						],
					}"
				></HighCharts>
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<div class="grid grid-cols-2 gap-2">
				<div v-for="query of queries" :key="query.id">
					<div v-if="!query.loading.formFrequencies">
						<span>{{ query.finalQuery }}</span>
						<VDataTable :items="query.data.wordFormFrequencies" density="compact" />
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
