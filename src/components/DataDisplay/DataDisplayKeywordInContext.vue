<script lang="ts" setup>
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import type { Ref } from "vue";

import { useAPIs } from "@/composables/useAPIs";
import { useAuthenticatedFetch } from "@/composables/useAuthenticatedFetch";
import { useCorporaStore } from "@/stores/corpora";

import CorpusChip from "../Search/CorpusChip.vue";
import KWICDetailDialog from "./KWICDetailDialog.vue";

const t = useTranslations("Corpsum");
const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const headers = ref([
	{ title: t("docid"), key: "docid", type: "string" },
	// { title: t("date"), key: "date", type: "string" },
	{ title: t("source"), key: "source", type: "string" },
	{ title: t("region"), key: "region", type: "string" },
	{ title: t("left"), key: "left", type: "string" },
	{ title: t("word"), key: "word", type: "string" },
	{ title: t("right"), key: "right", type: "string" },
	// { title: t("topic"), key: "topic", type: "string" },
	// { title: t("toknum"), key: "toknum", type: "string" },
	{ title: t("link"), key: "open", type: "string" },
]);

const { CREATE_SUBCORPUS_URL } = useAPIs();

const selected = ref([]);
const createSubcorpusMode = ref(false);
const showViewOptionsMode = ref(false);

function open(item: KeywordInContext) {
	selectedKWIC.value = item;
}

const subCorpusName = ref("");
const { authenticatedFetch } = useAuthenticatedFetch();
const corporaStore = useCorporaStore();
const { corporaForSearchWithoutSubCorpus, selectedCorpus } = storeToRefs(corporaStore);
async function createSubcorpus() {
	const { isConfirmed } = await Swal.fire({
		title: t("createSubcorpus"),
		text: `${t("createSubcorpusConfirm1")} '${subCorpusName.value}' ${t(
			"createSubcorpusConfirm2",
		)} ${selected.value.length || 0} ${t("createSubcorpusConfirm3")} ${
			selectedCorpus.value?.name
		}?`,
		showDenyButton: true,
	});

	if (isConfirmed) {
		// todo send results
		await authenticatedFetch(
			`${CREATE_SUBCORPUS_URL}?${corporaForSearchWithoutSubCorpus.value};subcname=${
				subCorpusName.value
			};create=True;${selected.value.map((docid: string) => `sca_doc.id=${docid}`).join(";")}`,
		);
		Swal.fire("Confirmed", t("corpusCreated")).then().catch(console.error);
		await corporaStore.fetchSubCorpora();
	}
}

const selectedKWIC: Ref<KeywordInContext | null> = ref(null);
const showIds = ref(false);
</script>

<template>
	<VCard>
		<VCardItem :title="t('keywordInContext')">
			<template #subtitle>
				{{ t("keywordInContextDesc") }}
			</template>
		</VCardItem>
		<VCardText class="py-0">
			<div class="flex gap-1" style="border: 1px solid red">
				<VCheckbox
					v-model="createSubcorpusMode"
					style="border: 1px solid blue"
					:label="t('showSubcorpusCreation')"
				></VCheckbox>
				<VCheckbox
					v-model="showViewOptionsMode"
					style="border: 1px solid blue"
					:label="t('viewOptions')"
				></VCheckbox>
			</div>
			<div v-if="createSubcorpusMode">
				<h2 class="text-lg">
					{{ t("createSubcorpus") }} {{ t("fromSelection") }} ({{ selected.length }}) in Corpus
					{{ selectedCorpus?.name }}
				</h2>
				<VTextField
					v-model="subCorpusName"
					label="Name"
					append-inner-icon="mdi-send-circle"
					@keydown.enter="createSubcorpus"
					@click:append-inner="createSubcorpus"
				/>
			</div>

			<div v-for="query of queries" :key="query.id" class="mt-2">
				<KWICAttributeSelect v-if="showViewOptionsMode" :query="query" />
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
						<template #[`item.docid`]="{ item }">
							<div class="group relative inline-block cursor-pointer">
								<div v-if="showIds" @click="showIds = false">
									{{ item.docid }}
								</div>
								<div v-else :title="item.docid" @click="showIds = true">
									...{{ item.docid.slice(-5) }}
								</div>
							</div>
						</template>
					</VDataTable>
					<KWICDetailDialog :query="query" :kwic="selectedKWIC" @close="selectedKWIC = null" />
				</div>
				<VProgressCircular v-else :color="query.color" indeterminate></VProgressCircular>
			</div>
		</VCardText>

		<VDivider></VDivider>
	</VCard>
</template>
