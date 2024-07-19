<script lang="ts" setup>
import { watch } from "vue";
import { useQuery } from "@tanstack/vue-query";

const suggestions: Ref<Array<string>> = ref([]);
const props = defineProps<{ query: CorpusQuery; element: any }>();

const vals = defineModel<Array<string> | FacettingRegexSearch>();

const api = useApiClient();

let avfrom = 0;
let lastSearch = "";

const search = ref("");

const modes = ["containing", "starts with", "ends with", "regex"];
const modeIndex = ref(0);

const compSearch = computed(() => {
	if (!search.value) return ".*";
	switch (modeIndex.value) {
		case 0:
			return `(?i).*${search.value}.*`;
		case 1:
			return `(?i)${search.value}.*`;
		case 2:
			return `(?i).*${search.value}`;
		case 3:
			return `${search.value}`;
		default:
			return `(?i).*${search.value}.*`;
	}
});
const { refetch } = useQuery({
	queryKey: [
		"get-attr-vals",
		props.query.corpus,
		props.element.name,
		avfrom,
		compSearch.value,
	] as const,
	queryFn: async () => {
		if (lastSearch !== compSearch.value) {
			avfrom = 0;
			suggestions.value = [];
		}
		lastSearch = compSearch.value;
		const response = await api.search.getAttrVals({
			corpname: props.query.corpus,
			avattr: props.element.name,
			avmaxitems: 15,
			avfrom,
			avpat: compSearch.value,
			icase: 1,
		});
		if (response.data.suggestions) {
			avfrom += 15;
			suggestions.value = [...suggestions.value, ...response.data.suggestions];
		}
		return response.data.suggestions;
	},
});

watch(
	() => props.element.name,
	async (val) => {
		console.log("changeSuggs", val);
		await changeSuggs();
	},
);

const regexSelection = () => {
	vals.value = {
		key: `fsca_${props.element.name}`,
		value: compSearch.value,
	};
};

const isRegExSearch = computed(() => vals.value?.key);

const changeSuggs = async () => {
	if (!vals.value) vals.value = [];
	avfrom = 0;
	if (props.element.Values) {
		suggestions.value = props.element.Values.map(({ v }) => v);
	} else {
		suggestions.value = [];
		await refetch();
	}
};

const addToSelection = (sugg: string) => {
	const isIn = vals.value.findIndex((s) => s === sugg);
	if (isIn >= 0) vals.value.splice(isIn, 1);
	else vals.value.push(sugg);
};
await changeSuggs();
</script>

<template>
	<div class="w-full mx-2">
		<div class="flex w-full gap-2" v-if="!isRegExSearch">
			<div class="w-full flex gap-1 items-end">
				<div class="flex flex-col items-start gap-1">
					<Label for="search">Mode</Label>
					<Button
						variant="outline"
						@click="modeIndex = (modeIndex + 1) % modes.length"
						class="flex gap-1"
					>
						<VIcon icon="mdi-swap-horizontal" />
						{{ modes[modeIndex] }}
					</Button>
				</div>
				<div class="flex flex-col items-start gap-1">
					<Label for="search">Search</Label>
					<Input id="search" v-model="search" type="text" @change="refetch()" />
				</div>
				<Button @click="refetch()">Search</Button>
				<Button v-if="search" variant="secondary" @click="regexSelection()">
					use '{{ search }}' as '{{ modes[modeIndex] }}' for search (this clears the rest of the
					selection)
				</Button>
			</div>
		</div>
		<template v-if="!isRegExSearch">
			<div v-for="sugg of suggestions" :key="sugg">
				<button
					class="w-full text-left text-lg"
					:class="{ 'bg-blue-400': vals && vals.includes(sugg) }"
					@click="addToSelection(sugg)"
				>
					{{ sugg }}
				</button>
			</div>
			<VBtn v-if="!props.element.Values && !isRegExSearch" @click="refetch()">Load more</VBtn>
		</template>
		<div class="" v-else>
			<Badge variant="outline">{{ vals.value }}</Badge>
			regexp selection. clear selection to select values.
			<Button class="inline" variant="outline" @click="vals = []">Clear Selection</Button>
		</div>
	</div>
</template>

<style lang="postcss" scoped></style>
