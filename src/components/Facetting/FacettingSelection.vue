<script lang="ts" setup>
import { useQuery } from "@tanstack/vue-query";
import { watch } from "vue";

interface Entry {
	name?: string;
	label?: string;
	attr_doc?: string;
	attr_doc_label?: string;
	Values?: {
		v?: string;
		xcnt?: number;
	};
}

const suggestions: Ref<Array<string>> = ref([]);
const props = defineProps<{ query: CorpusQuery; element: Entry }>();

const t = useTranslations("Corpsum");

const vals = defineModel<Array<string> | FacettingRegexSearch>();

const api = useApiClient();

let avfrom = 0;
let lastSearch = "";

const search = ref("");

const modes = [t("containing"), t("starts with"), t("ends with"), t("regex")];
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
const loading = ref(false);
const { refetch } = useQuery({
	queryKey: [
		"get-attr-vals",
		props.query.corpus,
		props.element.name,
		avfrom,
		compSearch.value,
	] as const,
	queryFn: async () => {
		if (loading.value) return;
		loading.value = true;
		if (lastSearch !== compSearch.value || props.element.Values) {
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
		loading.value = false;
		return response.data.suggestions;
	},
});

watch(
	() => props.element.name,
	async () => {
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
	<div class="mx-2 w-full">
		<div v-if="!isRegExSearch" class="flex w-full gap-2">
			<div class="flex w-full items-end gap-1">
				<div class="flex flex-col items-start gap-1">
					<Label for="search">{{ t("Mode") }}</Label>
					<Button
						variant="outline"
						class="flex gap-1"
						@click="modeIndex = (modeIndex + 1) % modes.length"
					>
						<VIcon icon="mdi-swap-horizontal" />
						{{ modes[modeIndex] }}
					</Button>
				</div>
				<div class="flex flex-col items-start gap-1">
					<Label for="search">{{ t("Search") }}</Label>
					<Input id="search" v-model="search" type="text" @change="refetch()" />
				</div>
				<Button @click="refetch()">{{ t("Search") }}</Button>
				<Button v-if="search" variant="secondary" @click="regexSelection()">
					{{
						$t("use-search-as-modes-modeindex-for-search-this-clears-the-rest-of-the-selection", [
							search,
							modes[modeIndex],
						])
					}}
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
			<Button v-if="!props.element.Values && !isRegExSearch" variant="outline" @click="refetch()">
				{{ t("Load more") }}
			</Button>
		</template>
		<div v-else class="">
			<Badge variant="outline">{{ vals.value }}</Badge>
			{{ $t("regexp-selection-clear-selection-to-select-values") }}
			<Button class="inline" variant="outline" @click="vals = []">
				{{ $t("clear-selection") }}
			</Button>
		</div>
	</div>
</template>
