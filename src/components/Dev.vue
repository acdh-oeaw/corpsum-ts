<script lang="ts" setup>
import { storeToRefs } from "pinia";

import { useSearchSettingsStore } from "../stores/searchSettings";

const corporaStore = useCorporaStore();
const { corpora, selectedCorpus, corpInfoResponse } = storeToRefs(corporaStore);

const query = useQueryStore();
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
					<h2>Corpora</h2>

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
					<p>corpInfoResponse:</p>
					<JsonViewer
						v-if="!disabled"
						preview-mode
						:value="corpInfoResponse"
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
