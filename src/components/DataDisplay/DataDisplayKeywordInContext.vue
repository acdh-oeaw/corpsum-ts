<script lang="ts" setup>
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import type { Ref } from "vue";

import { useAPIs } from "../../composables/useAPIs";
import { useAuthenticatedFetch } from "../../composables/useAuthenticatedFetch";
import { useCorporaStore } from "../../stores/corpora";
import CorpusChip from "../Search/CorpusChip.vue";
import KWICDetailDialog from "./KWICDetailDialog.vue";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const headers = ref([
	{ title: "date", key: "date", type: "string" },
	{ title: "source", key: "source", type: "string" },
	{ title: "region", key: "region", type: "string" },
	{ title: "left", key: "left", type: "string" },
	{ title: "word", key: "word", type: "string" },
	{ title: "right", key: "right", type: "string" },
	{ title: "docid", key: "docid", type: "string" },
	{ title: "topic", key: "topic", type: "string" },
	{ title: "toknum", key: "toknum", type: "string" },
	{ title: "open", key: "open", type: "string" },
]);

const { CREATE_SUBCORPUS_URL } = useAPIs();

const selected = ref([]);
const createSubcorpusMode = ref(false);

function open(item: KeywordInContext) {
	// console.log("open", { item });
	selectedKWIC.value = item;
}

const subCorpusName = ref("");
const { authenticatedFetch } = useAuthenticatedFetch();
const { corporaForSearchWithoutSubCorpus, fetchSubCorpora } = useCorporaStore();
async function createSubcorpus() {
	const { isConfirmed } = await Swal.fire({
		title: "Create Subcorpus",
		text: `Do you really want to create a subcorpus named '${subCorpusName.value}'' containing ${
			selected.value.length || 0
		} documents?`,
		showDenyButton: true,
	});

	if (isConfirmed) {
		// todo send results
		await authenticatedFetch(
			`${CREATE_SUBCORPUS_URL}?${corporaForSearchWithoutSubCorpus};subcname=${
				subCorpusName.value
			};create=True;${selected.value.map((docid: string) => `sca_doc.id=${docid}`).join(";")}`,
			// 			"${CREATE_SUBCORPUS_URL}?${corporaForSearchWithoutSubCorpus};reload=;subcname=testcorbussi;create=Trueundefined;sca_doc.id=APA_19860220_APA0002;sca_doc.id=APA_19860220_APA0003",
		);
		Swal.fire("Confirmed", "Subcorpus created successfully!")
			.then(console.log)
			.catch(console.error);
		await fetchSubCorpora();
	}
}

const selectedKWIC: Ref<KeywordInContext | null> = ref(null);
</script>

<template>
	<VCard>
		<VCardItem title="Keyword in Context View"></VCardItem>
		<VCardText class="py-0">
			<VCheckbox v-model="createSubcorpusMode" label="Show Subcorpus Creation"></VCheckbox>
			<div v-if="createSubcorpusMode">
				<p>Create Sub-Corpus from Selection ({{ selected.length }})</p>
				<VTextField
					v-model="subCorpusName"
					label="Name"
					append-inner-icon="mdi-send-circle"
					@keydown.enter="createSubcorpus"
					@click:append-inner="createSubcorpus"
				/>
			</div>

			<div v-for="query of queries" :key="query.id">
				<div v-if="!query.loading.keywordInContext">
					<span :style="`color: ${query.color}`">
						{{ query.type }}: {{ query.userInput }}
						<CorpusChip :query="query" />
					</span>
					<VDataTable
						v-model="selected"
						density="compact"
						:headers="headers"
						item-value="docid"
						:show-select="createSubcorpusMode"
						:items="query.data.keywordInContext"
						dense
					>
						<template #[`item.open`]="{ item }">
							<VIcon size="small" class="me-2" icon="mdi-open-in-new" @click="open(item)" />
						</template>
					</VDataTable>
					<KWICDetailDialog :kwic="selectedKWIC" @close="selectedKWIC = null" />
				</div>
				<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
			</div>
		</VCardText>

		<VDivider></VDivider>
	</VCard>
</template>
