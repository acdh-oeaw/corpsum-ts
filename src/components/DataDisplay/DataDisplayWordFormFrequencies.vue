<script lang="ts" setup>
import { storeToRefs } from "pinia";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);
const mode = ref("relative");

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
			<VBtnToggle v-model="mode" density="compact">
				<VBtn variant="outlined" value="absolute">Absolute</VBtn>

				<VBtn variant="outlined" value="relative">Relative</VBtn>
			</VBtnToggle>
			<div v-for="query of queries" :key="query.id">
				<div v-if="query.loading.wordFormFrequencies">
					<VProgressCircular :color="query.color" indeterminate></VProgressCircular>
					<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
				</div>
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
								name: `${query.type}: ${query.userInput} ${query.corpus}${
									query.subCorpus ? ` / ${query.subCorpus}` : ''
								}`,
								data: query.data.wordFormFrequencies.map(({ relative, absolute }) =>
									mode === 'relative' ? relative : absolute,
								),
							},
						],
					}"
				></HighCharts>
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<div class="m-2 grid grid-cols-2 gap-2">
				<div v-for="query of queries" :key="query.id">
					<div v-if="!query.loading.wordFormFrequencies">
						<span :style="`color: ${query.color}`">
							{{ query.type }}: {{ query.userInput }}
							<CorpusChip :query="query" />
						</span>

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
