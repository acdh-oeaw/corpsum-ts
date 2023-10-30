<script lang="ts" setup>
import { storeToRefs } from "pinia";

import DataDisplayKeywordInContext from "../components/DataDisplay/DataDisplayKeywordInContext.vue";
import DataDisplayRegionalFrequencies from "../components/DataDisplay/DataDisplayRegionalFrequencies.vue";
import DataDisplayWordFormFrequencies from "../components/DataDisplay/DataDisplayWordFormFrequencies.vue";
import { useQuery } from "../stores/query";

// import { VDataTable } from "vuetify/labs/VDataTable";

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
		<VContainer>
			<h1>{{ t("title") }}</h1>
			<p>This is the amazing page for the whole Corpsum application</p>
		</VContainer>

		<Search></Search>
		<!-- <v-data-table /> -->
		<VContainer>
			<div class="flex flex-wrap gap-3">
				<!-- <DisplayCard v-for="i in 2" :key="i" :title="titles[i]"></DisplayCard> -->

				<DataDisplayYearlyFrequencies :queries="queries"></DataDisplayYearlyFrequencies>
				<DataDisplayWordFormFrequencies :queries="queries"></DataDisplayWordFormFrequencies>
				<DataDisplayRegionalFrequencies :queries="queries"></DataDisplayRegionalFrequencies>
				<DataDisplayKeywordInContext :queries="queries"></DataDisplayKeywordInContext>
			</div>
		</VContainer>
	</MainContent>
</template>
