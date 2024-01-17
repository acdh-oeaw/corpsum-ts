<script lang="ts" setup>
import { storeToRefs } from "pinia";

const t = useTranslations("Corpsum");
const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const mode = ref("relative");
const expand = ref(false);

const categories = computed(() => {
	const allCats: Array<string> = [];
	queries.value.forEach((query: CorpusQuery) => {
		query.data.mediaSources.forEach((qm) => allCats.push(qm.media));
	});
	return [...new Set(allCats)];
});

const series = computed(() => {
	const allSeries = queries.value.map((query: CorpusQuery) => {
		return {
			color: query.color,
			name: `${query.type}: ${query.userInput} (${query.corpus}${
				query.subCorpus ? ` / ${query.subCorpus})` : ")"
			}`,
			data: categories.value
				.map((category) => query.data.mediaSources.find(({ media }) => category === media))
				// @ts-ignore
				.map((a) => (a ? a[mode.value] : 0)),
		};
	});
	return allSeries;
});
</script>

<template>
	<VCard>
		<VCardItem :title="t('MediaSources')">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				{{ t("MediaSourcesDesc") }}
			</template>
		</VCardItem>

		<VCardText>
			<VBtnToggle v-model="mode" density="compact">
				<VBtn variant="outlined" value="absolute">{{ t("absolute") }}</VBtn>
				<VBtn variant="outlined" value="relative">{{ t("relative") }}</VBtn>
			</VBtnToggle>
			<div v-for="query of queries" :key="query.id">
				<div v-if="query.loading.mediaSources">
					<VProgressCircular :color="query.color" indeterminate></VProgressCircular>
					<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
				</div>
			</div>
			<HighCharts
				style="height: 1200px"
				:options="{
					chart: {
						type: 'bar',
					},
					title: {
						text: `${series.length} ${t('queries')}`,
						align: 'center',
					},
					xAxis: {
						categories: categories,
					},

					yAxis: {
						title: {
							text: t('sources'),
						},
					},
					series,
				}"
			></HighCharts>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable :queries="queries" datatype="mediaSources"></DataDisplaySourceTable>
		</VExpandTransition>

		<VDivider></VDivider>

		<VCardActions>
			<VBtn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? t("ShowData") : t("HideData") }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>
