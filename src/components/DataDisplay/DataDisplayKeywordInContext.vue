<script lang="ts" setup>
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import type { Ref } from "vue";

import KWICDetailDialog from "./KWICDetailDialog.vue";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const headers = ref([
	// { title: "date", key: "date", type: "string" },
	// { title: "source", key: "source", type: "string" },
	// { title: "region", key: "region", type: "string" },
	{ title: "left", key: "left", type: "string" },
	{ title: "word", key: "word", type: "string" },
	{ title: "right", key: "right", type: "string" },
	{ title: "docid", key: "docid", type: "string" },
	// { title: "topic", key: "topic", type: "string" },
	{ title: "toknum", key: "toknum", type: "string" },
	{ title: "open", key: "open", type: "string" },
]);

const selected = ref([]);
const createSubcorpusMode = ref(false);

function open(item: KeywordInContext) {
	// console.log("open", { item });
	selectedKWIC.value = item;
}

const subCorpusName = ref("");

async function createSubcorpus() {
	const { isConfirmed } = await Swal.fire({
		title: "Create Subcorpus",
		text: `Do you really want to create a subcorpus named '${subCorpusName.value}'' containing ${
			selected.value.length || 0
		} documents?`,
		showDenyButton: true,
	});

	if (isConfirmed) {
		return Swal.fire(
			"Confirmed*",
			"Currently this does not yet send a request, so actually no subcorpus is created",
		);
		// todo send results
		// await  useFetch()
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
						{{ query.finalQuery }}
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
