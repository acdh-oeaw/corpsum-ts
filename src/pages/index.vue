<script lang="ts" setup>
import { storeToRefs } from "pinia";

import DataDisplayKeywordInContext from "../components/DataDisplay/DataDisplayKeywordInContext.vue";
import DataDisplayMediaSource from "../components/DataDisplay/DataDisplayMediaSource.vue";
import DataDisplayRegionalFrequencies from "../components/DataDisplay/DataDisplayRegionalFrequencies.vue";
import DataDisplayWordFormFrequencies from "../components/DataDisplay/DataDisplayWordFormFrequencies.vue";
import { useQuery } from "../stores/query";
import { useSearchSettingsStore } from "../stores/searchSettings";

definePageMeta({
	title: "Corpsum.meta.title",
});

const searchSettings = useSearchSettingsStore();
const { selectedSearches } = storeToRefs(searchSettings);

const t = useTranslations("Corpsum");

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);
</script>

<template>
	<MainContent class="container py-8">
		<ClientOnly>
			<VContainer>
				<h1>{{ t("title") }}</h1>
			</VContainer>

			<Search></Search>
			<!-- <v-data-table /> -->
			<VContainer>
				<div class="" :class="['grid', 'gap-3', `grid-cols-1`]">
					<!-- <DisplayCard v-for="i in 2" :key="i" :title="titles[i]"></DisplayCard> -->

					<DataDisplayYearlyFrequencies
						v-if="selectedSearches.includes('yearlyFrequencies' as unknown as SearchFunctionKey)"
						:queries="queries"
					></DataDisplayYearlyFrequencies>
					<DataDisplayWordFormFrequencies
						v-if="selectedSearches.includes('wordFormFrequencies' as unknown as SearchFunctionKey)"
						:queries="queries"
					></DataDisplayWordFormFrequencies>
					<DataDisplayRegionalFrequencies
						v-if="selectedSearches.includes('regionalFrequencies' as unknown as SearchFunctionKey)"
						:queries="queries"
					></DataDisplayRegionalFrequencies>
					<DataDisplayMediaSource
						v-if="selectedSearches.includes('mediaSources' as unknown as SearchFunctionKey)"
						:queries="queries"
					/>
					<DataDisplayKeywordInContext
						v-if="selectedSearches.includes('keywordInContext' as unknown as SearchFunctionKey)"
						:queries="queries"
					></DataDisplayKeywordInContext>
				</div>
			</VContainer>
			<!-- <Dev /> -->
		</ClientOnly>
	</MainContent>
</template>
