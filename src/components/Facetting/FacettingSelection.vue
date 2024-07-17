<script lang="ts" setup>
import { watch } from "vue";

const { ATTR_VALS_URL } = useAPIs();

const suggestions = ref([]);
const props = defineProps<{ query: CorpusQuery; element: any }>();
const { authenticatedFetch } = useAuthenticatedFetch();

const vals = defineModel<Array<string> | string>();

let avfrom = 0;
let lastSearch = "";
const getOptions = async (avpat = ".*") => {
	const { data: options } = await authenticatedFetch(ATTR_VALS_URL, {
		params: {
			corpname: props.query.corpus,
			avattr: props.element.name,
			avmaxitems: "15",
			avfrom,
			avpat,
			icase: "1",
		},
	});
	return options.value.suggestions;
};

watch(
	() => props.element.name,
	async (val) => {
		console.log("changeSuggs", val);
		await changeSuggs();
	},
);

const doSearch = async () => {
	if (lastSearch !== search.value) {
		avfrom = 0;
		suggestions.value = [];
	}
	lastSearch = search.value;
	const foundOptions = await getOptions(`.*${search.value}.*`);
	suggestions.value = [...suggestions.value, ...foundOptions];
	avfrom += 15;
};

const regexSelection = () => {
	vals.value = [`REGEXSEARCH_${search.value}`];
};

const isRegExSearch = computed(
	() => vals.value?.length && vals.value[0].startsWith("REGEXSEARCH_"),
);

const changeSuggs = async () => {
	if (!vals.value) vals.value = [];
	avfrom = 0;
	if (props.element.Values) {
		suggestions.value = props.element.Values.map(({ v }) => v);
	} else suggestions.value = await getOptions();
	avfrom += 15;
};
const search = ref("");

const addToSelection = (sugg: string) => {
	const isIn = vals.value.findIndex((s) => s === sugg);
	if (isIn >= 0) vals.value.splice(isIn, 1);
	else vals.value.push(sugg);
};
await changeSuggs();
const modes = ["containing", "starts with", "ends with", "regex"];
const modeIndex = ref(0);
</script>

<template>
	<div class="w-full">
		<!-- {{ props.element.name }}
		vals {{ vals }} -->
		{{ isRegExSearch }}
		<div class="flex w-full gap-2">
			<VBtn @click="modeIndex = (modeIndex + 1) % modes.length">{{ modes[modeIndex] }}</VBtn>
			<VTextField
				v-model="search"
				label="Search"
				type="text"
				class="flex-1 rounded-sm border-black"
				@change="doSearch()"
			/>
			<button
				v-if="search"
				class="rounded-sm border border-solid border-black"
				@click="regexSelection()"
			>
				use '{{ search }}' as '{{ modes[modeIndex] }}'
				<br />
				for search
				<br />
				(this clears the rest of the selection)
			</button>
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
			<VBtn v-if="!props.element.Values && !isRegExSearch" @click="doSearch()">Load more</VBtn>
		</template>
		<div v-else>
			regexp selection. clear selection to select values.
			<button class="rounded border border-solid" @click="vals = []">CLEAR SELECTION</button>
		</div>
	</div>
</template>

<style lang="postcss" scoped></style>
