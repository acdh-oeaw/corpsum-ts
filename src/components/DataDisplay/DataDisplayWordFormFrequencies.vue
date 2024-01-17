<script lang="ts" setup>
import { storeToRefs } from "pinia";

const t = useTranslations("Corpsum");
const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const mode = ref("relative");
const expand = ref(false);
</script>

<template>
	<VCard>
		<VCardItem :title="t('WordFormFrequencies')">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				{{t('WordFormFrequenciesDesc')}}
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<VBtnToggle v-model="mode" density="compact">
				<VBtn variant="outlined" value="absolute">{{ t("absolute") }}</VBtn>
				<VBtn variant="outlined" value="relative">{{ t("relative") }}</VBtn>
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
								text: t('sources'),
							},
						},
						series: [
							{
								color: query.color,
								name: `${query.type}: ${query.userInput} (${query.corpus}${
									query.subCorpus ? ` / ${query.subCorpus})` : ')'
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
			<DataDisplaySourceTable :queries="queries" datatype="wordFormFrequencies"></DataDisplaySourceTable>
		</VExpandTransition>

		<VDivider></VDivider>

		<VCardActions>
			<VBtn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? t("ShowData") : t("HideData") }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>
