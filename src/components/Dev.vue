<script lang="ts" setup>
import { storeToRefs } from "pinia";

import { useSearchSettingsStore } from "../stores/searchSettings";

const corporaStore = useCorporaStore();
const { corpora, selectedCorpus, tracker } = storeToRefs(corporaStore);

const testStore = useTestStoreStore();
const { niceArray } = storeToRefs(testStore);

const query = useQuery();
const { queries, nextQueryId } = storeToRefs(query);
const disabled = ref(false);
const searchSettings = useSearchSettingsStore();

function refresh() {
	disabled.value = true;
	setTimeout(() => {
		disabled.value = false;
	}, 300);
}
</script>

<template>
	<p></p>
	<VExpansionPanels>
		<VExpansionPanel>
			<VExpansionPanelTitle>Dev View</VExpansionPanelTitle>
			<VExpansionPanelText>
				<!-- <ChartTest></ChartTest> -->

				<div>
					<h2>test</h2>

					<JsonViewer
						v-if="!disabled"
						preview-mode
						show-double-quotes
						:value="niceArray"
						:expand-depth="5"
						boxed
						@click.alt="refresh()"
					></JsonViewer>
				</div>
				<div>
					<h2>Corpora</h2>
					<p>Corpora:</p>
					<JsonViewer
						v-if="!disabled"
						preview-mode
						:value="corpora"
						:expand-depth="5"
						boxed
						@click.alt="refresh()"
					></JsonViewer>

					<p>selectedCorpus:</p>
					<JsonViewer
						v-if="!disabled"
						preview-mode
						:value="selectedCorpus"
						:expand-depth="5"
						boxed
						@click.alt="refresh()"
					></JsonViewer>

					<p>tracker</p>
					<JsonViewer
						v-if="!disabled"
						preview-mode
						:value="tracker"
						:expand-depth="5"
						boxed
						@click.alt="refresh()"
					></JsonViewer>
				</div>

				<div>
					<h2>Query</h2>
					<p>queries,</p>

					<JsonViewer
						v-if="!disabled"
						preview-mode
						:value="queries"
						:expand-depth="5"
						boxed
						@click.alt="refresh()"
					></JsonViewer>

					<p>nextQueryId</p>
					<JsonViewer
						v-if="!disabled"
						preview-mode
						:value="nextQueryId"
						:expand-depth="5"
						boxed
						@click.alt="refresh()"
					></JsonViewer>
				</div>
				<div>
					<h2>Search Settings</h2>
					<JsonViewer
						v-if="!disabled"
						preview-mode
						:value="searchSettings.selectedSearches"
						:expand-depth="5"
						boxed
						@click.alt="refresh()"
					></JsonViewer>
				</div>
			</VExpansionPanelText>
		</VExpansionPanel>
	</VExpansionPanels>
</template>
