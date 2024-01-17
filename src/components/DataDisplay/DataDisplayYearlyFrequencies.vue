<script lang="ts" setup>
import { storeToRefs } from "pinia";

const t = useTranslations("Corpsum");
const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const mode = ref("relative");
const expand = ref(false);

const series = computed(() =>
	queries.value
		.filter((q: CorpusQuery) => !q.loading.yearlyFrequencies)
		.map((query: CorpusQuery) => ({
			name: `${query.type}: ${query.userInput} (${query.corpus}${
				query.subCorpus ? ` / ${query.subCorpus})` : ")"
			}`,
			data: query.data.yearlyFrequencies
				.sort((a, b) => b.year - a.year)
				.map((point) => [point.year, mode.value === "relative" ? point.relative : point.absolute]),
			color: query.color,
		})),
);
</script>

<template>
	<VCard>
		<VCardItem :title="t('YearlyFrequencies')">
			<template #subtitle>
				{{ t("YearlyFrequenciesDesc") }}
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<VBtnToggle v-model="mode" density="compact">
				<VBtn variant="outlined" value="absolute">{{ t("absolute") }}</VBtn>
				<VBtn variant="outlined" value="relative">{{ t("relative") }}</VBtn>
			</VBtnToggle>
			<div v-for="query of queries" :key="query.id">
				<div v-if="query.loading.yearlyFrequencies">
					<VProgressCircular :color="query.color" indeterminate></VProgressCircular>
					<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
				</div>
			</div>
			<HighCharts
				:options="{
					series,
					title: {
						text: `${series.length} ${t('queries')}`,
						align: 'center',
					},
					yAxis: {
						title: {
							text: t('sources'),
						},
					},
				}"
			></HighCharts>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable
				:queries="queries"
				datatype="yearlyFrequencies"
			></DataDisplaySourceTable>
		</VExpandTransition>

		<VDivider></VDivider>

		<VCardActions>
			<VBtn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? t("ShowData") : t("HideData") }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>
