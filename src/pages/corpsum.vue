<script lang="ts" setup>
import { storeToRefs } from "pinia";

import DataDisplayKeywordInContext from "../components/DataDisplay/DataDisplayKeywordInContext.vue";
import DataDisplayMediaSource from "../components/DataDisplay/DataDisplayMediaSource.vue";
import DataDisplayRegionalFrequencies from "../components/DataDisplay/DataDisplayRegionalFrequencies.vue";
import DataDisplayWordFormFrequencies from "../components/DataDisplay/DataDisplayWordFormFrequencies.vue";
import { useQuery } from "../stores/query";
import { useSearchSettingsStore } from "../stores/searchSettings";

const searchSettings = useSearchSettingsStore();
const { selectedSearches } = storeToRefs(searchSettings);
definePageMeta({
	title: "Corpsum.meta.title",
});

const t = useTranslations("Corpsum");

// const titles = [
// 	"Frequencies and Forms",
// 	"Yearly Frequencies",
// 	"Distribution of Media Sources",
// 	"Regional Frequencies",
// 	"Keyword in Context",
// ];

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);
</script>

<template>
	<MainContent class="container py-8">
		<ClientOnly>
			<VContainer>
				<h1>{{ t("title") }}</h1>
				<p>This is the amazing page for the whole Corpsum application</p>
			</VContainer>

			<Search></Search>
			<!-- <v-data-table /> -->
			<VContainer>
				<div class="grid grid-cols-1 gap-3">
					<!-- <DisplayCard v-for="i in 2" :key="i" :title="titles[i]"></DisplayCard> -->

					<DataDisplayYearlyFrequencies
						v-if="selectedSearches.includes('yearlyFrequencies')"
						:queries="queries"
					></DataDisplayYearlyFrequencies>
					<DataDisplayWordFormFrequencies
						v-if="selectedSearches.includes('wordFormFrequencies')"
						:queries="queries"
					></DataDisplayWordFormFrequencies>
					<DataDisplayRegionalFrequencies
						v-if="selectedSearches.includes('regionalFrequencies')"
						:queries="queries"
					></DataDisplayRegionalFrequencies>
					<DataDisplayKeywordInContext
						v-if="selectedSearches.includes('keywordInContext')"
						:queries="queries"
					></DataDisplayKeywordInContext>

					<DataDisplayMediaSource
						v-if="selectedSearches.includes('mediaSources')"
						:queries="queries"
					/>
				</div>
			</VContainer>
			<Dev />
		</ClientOnly>
	</MainContent>
</template>
