<script setup lang="ts">
import type { components } from "~/lib/noske-types";

interface EntryLine {
	name?: string;
	label?: string;
	attr_doc?: string;
	attr_doc_label?: string;
	Values?: Array<{
		v?: string;
		xcnt?: number;
	}>;
}

interface FacettingRegexSearch {
	key: string;
	value: string;
}

const props = defineProps<{
	query: {
		noske: string;
		corpus: string;
	};
	element: EntryLine;
	modelValue: Array<string> | FacettingRegexSearch;
}>();

const emit = defineEmits<{
	(event: "update:modelValue", value: Array<string> | FacettingRegexSearch): void;
}>();

const t = useTranslations();
const { useNoskeQuery } = useNoskeClient(computed(() => props.query.noske || null));

const suggestions = ref<Array<string>>([]);
const listRef = ref<HTMLDivElement | null>(null);
const search = ref("");
const modeIndex = ref(0);
const avfrom = ref(0);
const lastSearch = ref("");

const modes = computed(() => [
	t("FacettingSelection.modes.contains"),
	t("FacettingSelection.modes.startsWith"),
	t("FacettingSelection.modes.endsWith"),
	t("FacettingSelection.modes.regex"),
]);

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
			return search.value;
		default:
			return `(?i).*${search.value}.*`;
	}
});

const values = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const isRegexSearch = computed(() => values.value && !Array.isArray(values.value));
const regexValue = computed(() =>
	isRegexSearch.value ? (values.value as FacettingRegexSearch).value : "",
);

const attrValsQuery = useNoskeQuery<components["schemas"]["09_attr_vals"]>({
	queryKey: computed(() => [
		"attr-vals",
		props.query.noske,
		props.query.corpus,
		props.element.name,
		compSearch.value,
	]),
	enabled: computed(() => false),
	initialData: {},
	async queryFn(client) {
		if (!props.element.name) return {};
		if (lastSearch.value !== compSearch.value || props.element.Values) {
			avfrom.value = 0;
			suggestions.value = [];
		}
		lastSearch.value = compSearch.value;
		const { data, error } = await client.GET("/search/attr_vals", {
			params: {
				query: {
					corpname: props.query.corpus,
					avattr: props.element.name,
					avmaxitems: 15,
					avfrom: avfrom.value,
					avpat: compSearch.value,
					icase: 1,
				},
			},
		});
		if (error) throw error;
		if (data?.suggestions && data.request?.avattr === props.element.name) {
			avfrom.value += 15;
			suggestions.value = [...suggestions.value, ...data.suggestions];
		}
		return data ?? {};
	},
});

const isFetchingAttrVals = computed(() => attrValsQuery.isFetching.value);

const changeSuggs = async () => {
	if (!values.value) values.value = [];
	avfrom.value = 0;
	if (props.element.Values) {
		suggestions.value = props.element.Values.map(({ v }) => v).filter((value): value is string =>
			Boolean(value),
		);
	} else {
		suggestions.value = [];
		await attrValsQuery.refetch();
	}
};

const regexSelection = () => {
	if (!props.element.name) return;
	values.value = {
		key: `fsca_${props.element.name}`,
		value: compSearch.value,
	};
};

const clearRegexSelection = () => {
	values.value = [];
};

const addToSelection = (sugg: string) => {
	const current = Array.isArray(values.value) ? values.value : [];
	const index = current.findIndex((value) => value === sugg);
	const next = [...current];
	if (index >= 0) next.splice(index, 1);
	else next.push(sugg);
	values.value = next;
};

watch(
	() => props.element.name,
	async () => {
		await changeSuggs();
	},
);

watch(
	() => suggestions.value.length,
	async (length, previous) => {
		if (length > previous) {
			await nextTick();
			if (listRef.value) {
				listRef.value.scrollTop = listRef.value.scrollHeight;
			}
		}
	},
);

await changeSuggs();
</script>

<template>
	<div class="flex size-full flex-col gap-4">
		<div v-if="!isRegexSearch" class="flex flex-wrap items-end gap-3">
			<div class="flex flex-col gap-1">
				<Label for="search-mode">{{ t("FacettingSelection.labels.mode") }}</Label>
				<Button
					id="search-mode"
					class="flex items-center gap-2"
					variant="outline"
					@click="modeIndex = (modeIndex + 1) % modes.length"
				>
					<LucideIcon class="size-4" name="ArrowLeftRight" />
					{{ modes[modeIndex] }}
				</Button>
			</div>
			<div class="flex flex-col gap-1">
				<Label for="search">{{ t("FacettingSelection.labels.search") }}</Label>
				<Input id="search" v-model="search" type="text" @change="attrValsQuery.refetch()" />
			</div>
			<Button @click="attrValsQuery.refetch()">
				{{ t("FacettingSelection.actions.search") }}
			</Button>
			<Button v-if="search" variant="secondary" @click="regexSelection()">
				{{
					t("FacettingSelection.actions.useSearchAsRegex", {
						search: search,
						mode: modes[modeIndex],
					})
				}}
			</Button>
		</div>

		<template v-if="!isRegexSearch">
			<div ref="listRef" class="flex-1 overflow-y-auto pr-1">
				<div v-for="sugg of suggestions" :key="sugg">
					<button
						class="w-full rounded-md px-3 py-2 text-left text-sm transition"
						:class="{
							'bg-muted font-medium': Array.isArray(values) && values.includes(sugg),
							'hover:bg-muted/60': true,
						}"
						@click="addToSelection(sugg)"
					>
						{{ sugg }}
					</button>
				</div>
			</div>
			<Button
				v-if="!props.element.Values && !isRegexSearch"
				:disabled="isFetchingAttrVals"
				variant="outline"
				@click="attrValsQuery.refetch()"
			>
				{{ t("FacettingSelection.actions.loadMore") }}
			</Button>
		</template>

		<div v-else class="flex flex-wrap items-center gap-2 text-sm">
			<Badge variant="outline">{{ regexValue }}</Badge>
			<span class="text-muted-foreground">
				{{ t("FacettingSelection.messages.regexSelection") }}
			</span>
			<Button size="sm" variant="outline" @click="clearRegexSelection()">
				{{ t("FacettingSelection.actions.clearSelection") }}
			</Button>
		</div>
	</div>
</template>
