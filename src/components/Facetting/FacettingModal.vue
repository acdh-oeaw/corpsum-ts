<script lang="ts" setup>
import { useQuery } from "@tanstack/vue-query";

const props = defineProps<{ query: CorpusQuery }>();

const dialog = ref(true);

const emits = defineEmits(["close"]);

const api = useApiClient();

// todo  fetch the corpus results
// const corpusStore = useCorporaStore();
// const { corpInfoResponse } = storeToRefs(corpusStore);

// const { data } = await api.search.getTextTypesWithNorms({
// 	corpname: props.query.corpus,
// });

const { data } = useQuery({
	queryKey: ["get-texttypes-with-norms", props.query.corpus] as const,
	queryFn: async () => {
		const response = await api.search.getTextTypesWithNorms({
			corpname: props.query.corpus,
		});
		return response.data;
	},
});

// todo This is all basically just prep work / heavy work in progress

// attr_vals?corpname=amc_4.2&avattr=doc.id&avmaxitems=15&avfrom=0&avpat=.*&icase=1

function removeFromSelection(name: string, index) {
	props.query.facettingValues[name].splice(index, 1);
}
function clearRegexSearch(name: string) {
	props.query.facettingValues[name] = [];
}
const selected = ref({});
</script>

<template>
	<VDialog v-model="dialog" persistent>
		<VCard class="size-full">
			<h1 class="flex justify-between text-xl p-2">
				<span>
					Facetting filters for
					<span class="font-bold" :style="`color: ${query.color}`">{{ query.userInput }}</span>
				</span>
				<Button variant="outline" @click="emits('close')">close</Button>
			</h1>

			<!-- {{ query.corpus }}
			<VBtn @click="loadAllSuggs()">load all</VBtn> -->

			<div class="flex">
				<div class="flex flex-col ml-1" v-if="data?.Blocks">
					<div v-for="entry of data.Blocks" :key="entry.name">
						<button
							class="flex w-full justify-start text-lg px-1"
							:class="{
								'bg-blue-300': selected.name === entry.Line[0].name,
								'bg-yellow-100':
									selected.name !== entry.Line[0].name &&
									query.facettingValues[entry.Line[0].name]?.length,
							}"
							@click="selected = entry.Line[0]"
						>
							{{ entry.Line[0].name }}
						</button>
						<div v-if="query.facettingValues[entry.Line[0].name]" class="flex flex-col">
							<template v-if="Array.isArray(query.facettingValues[entry.Line[0].name])">
								<span
									v-for="(val, i) of query.facettingValues[entry.Line[0].name]"
									:key="i"
									class="flex w-full justify-between text-xs items-center bg-yellow-50"
								>
									<span class="ml-3">
										{{ val }}
									</span>

									<Button
										variant="outline"
										size="xs"
										class="rounded border border-solid"
										@click="removeFromSelection(entry.Line[0].name, i)"
									>
										x
									</Button>
								</span>
							</template>
							<template v-if="query.facettingValues[entry.Line[0].name]?.key">
								<span class="flex w-full justify-between text-xs items-center">
									<Badge variant="outline">
										{{ query.facettingValues[entry.Line[0].name].value }}
									</Badge>
									<Button variant="outline" size="xs" @click="clearRegexSearch(entry.Line[0].name)">
										x
									</Button>
								</span>
							</template>
						</div>
					</div>
				</div>
				<div class="flex w-full flex-col border-l-2" v-if="selected">
					<div v-if="selected?.name" class="w-full">
						<!-- {{ selected.name }} {{ selected.Values?.length }} -->
						<FacettingSelection
							v-model="query.facettingValues[selected.name]"
							:element="selected"
							:query="query"
						></FacettingSelection>
					</div>
				</div>
			</div>
		</VCard>
	</VDialog>
</template>

<style lang="postcss" scoped></style>
