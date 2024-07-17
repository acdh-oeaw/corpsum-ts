<script lang="ts" setup>
import { storeToRefs } from "pinia";

const props = defineProps<{ query: CorpusQuery }>();

const dialog = ref(true);

const emits = defineEmits(["close"]);

const { authenticatedFetch } = useAuthenticatedFetch();

// todo  fetch the corpus results
// const corpusStore = useCorporaStore();
// const { corpInfoResponse } = storeToRefs(corpusStore);
const { FACETTING_URL, ATTR_VALS_URL } = useAPIs();
const { data } = await authenticatedFetch(`${FACETTING_URL}`, {
	params: {
		corpname: props.query.corpus,
	},
});
// todo This is all basically just prep work / heavy work in progress

// attr_vals?corpname=amc_4.2&avattr=doc.id&avmaxitems=15&avfrom=0&avpat=.*&icase=1
const getOptions = async (attr: string, avpat = ".*") => {
	const { data: options } = await authenticatedFetch(ATTR_VALS_URL, {
		params: {
			corpname: props.query.corpus,
			avattr: attr,
			avmaxitems: "15",
			avfrom: "0",
			avpat,
			icase: "1",
		},
	});
	return options.value.suggestions;
};
const suggestions = ref({});
// const loadAllSuggs = async () => {
// 	for (let i = 0; i < data.value.Blocks.length; i++) {
// 		const element = data.value.Blocks[i].Line[0];
// 		if (element.Values) {
// 			suggestions.value[element.name] = element.Values.map(({ v }) => v);
// 		} else suggestions.value[element.name] = await getOptions(element.name);
// 	}
// };
function removeFromSelection(name, index) {
	vals.value[name].splice(index, 1);
}
const selected = ref({});
const vals = ref({});
</script>

<template>
	<VDialog v-model="dialog" persistent>
		<VCard class="size-full">
			<h1 class="flex justify-between text-xl">
				WORK IN PROGRESS
				<VBtn @click="emits('close')">close</VBtn>
			</h1>

			<!-- {{ query.corpus }}
			<VBtn @click="loadAllSuggs()">load all</VBtn> -->

			<div class="flex">
				<div class="flex flex-col">
					<div v-for="entry of data.Blocks" :key="entry.name">
						<button
							class="flex w-full justify-start text-lg"
							:class="{
								'bg-blue-300': selected.name === entry.Line[0].name,
								'bg-yellow-100':
									selected.name !== entry.Line[0].name && vals[entry.Line[0].name]?.length,
							}"
							@click="selected = entry.Line[0]"
						>
							{{ entry.Line[0].name }}
						</button>
						<div v-if="vals[entry.Line[0].name]" class="flex flex-col">
							<span
								v-for="(val, i) of vals[entry.Line[0].name]"
								:key="i"
								class="flex w-full justify-between text-xs"
							>
								{{ val }}

								<button
									class="rounded border border-solid"
									@click="removeFromSelection(entry.Line[0].name, i)"
								>
									x
								</button>
							</span>
						</div>
					</div>
				</div>
				<div class="flex w-full flex-col border-l-2">
					<div v-if="selected?.name" class="w-full">
						{{ selected.name }} {{ selected.Values?.length }}
						<FacettingSelection
							v-model="vals[selected.name]"
							:element="selected"
							:query="query"
						></FacettingSelection>
					</div>
				</div>
			</div>
			<!-- <div class="flex flex-col gap-2">
				<div v-for="entry of data.Blocks" :key="entry.name">
					<h2 class="text-xl">{{ entry.Line[0].name }}</h2>
					<JsonViewer preview-mode :value="entry.Line[0]" :expand-depth="1" boxed></JsonViewer>
					<div>
						{{ suggestions[entry.Line[0].name] }}
					</div>
				</div>
			</div> -->
		</VCard>
	</VDialog>
</template>

<style lang="postcss" scoped></style>
