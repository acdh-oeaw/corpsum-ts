<script setup lang="ts">
import type { components } from "~/lib/noske-types";

interface FacettingRegexSearch {
	key: string;
	value: string;
}
type FacettingValues = Record<string, Array<string> | FacettingRegexSearch>;
type TextTypesWithNorms = components["schemas"]["15_textypes_with_norms"];
type EntryLine = NonNullable<NonNullable<TextTypesWithNorms["Blocks"]>[number]["Line"]>[number];
interface FacettingQueryContext {
	noske: string;
	corpus: string;
	userInput: string;
}

const props = withDefaults(
	defineProps<{
		query: FacettingQueryContext;
		modelValue: FacettingValues;
		open?: boolean;
	}>(),
	{
		open: true,
	},
);

const emit = defineEmits<{
	(event: "update:modelValue", value: FacettingValues): void;
	(event: "update:open", value: boolean): void;
	(event: "close"): void;
}>();

const t = useTranslations();
const dialogOpen = computed({
	get: () => props.open,
	set: (value) => {
		emit("update:open", value);
		if (!value) emit("close");
	},
});

const facettingValues = computed(() => props.modelValue ?? {});
const updateFacettingValues = (name: string, value: Array<string> | FacettingRegexSearch) => {
	emit("update:modelValue", {
		...facettingValues.value,
		[name]: value,
	});
};

const removeFromSelection = (name: string, index: number) => {
	const current = Array.isArray(facettingValues.value[name])
		? (facettingValues.value[name] as Array<string>)
		: [];
	updateFacettingValues(
		name,
		current.filter((_, i) => i !== index),
	);
};

const clearRegexSearch = (name: string) => {
	updateFacettingValues(name, []);
};

const { useNoskeQuery } = useNoskeClient(computed(() => props.query.noske || null));

const texttypesQuery = useNoskeQuery<TextTypesWithNorms>({
	queryKey: computed(() => ["texttypes-with-norms", props.query.noske, props.query.corpus]),
	initialData: { Blocks: [] },
	async queryFn(client) {
		const { data, error } = await client.GET("/search/texttypes_with_norms", {
			params: {
				query: {
					corpname: props.query.corpus,
				},
			},
		});
		if (error) throw error;
		return data ?? { Blocks: [] };
	},
});

const entries = computed(() => texttypesQuery.data.value?.Blocks ?? []);
const selected = ref<EntryLine | null>(null);
</script>

<template>
	<Dialog :open="dialogOpen" @update:open="dialogOpen = $event">
		<DialogContent class="flex h-[80vh] max-w-5xl flex-col overflow-hidden p-0">
			<DialogHeader class="border-b px-6 py-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<DialogTitle>
						{{ t("FacettingModal.title") }}
						<span class="font-semibold text-primary">{{ props.query.userInput }}</span>
					</DialogTitle>
					<DialogClose as-child>
						<Button size="sm" variant="outline">
							{{ t("FacettingModal.actions.close") }}
						</Button>
					</DialogClose>
				</div>
			</DialogHeader>
			<div class="flex min-h-0 flex-1">
				<div class="w-full max-w-[260px] overflow-y-auto border-r">
					<div v-if="entries.length" class="flex flex-col">
						<div v-for="entry of entries" :key="entry.Line?.[0]?.name">
							<button
								v-if="entry.Line && entry.Line[0]?.name"
								class="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition"
								:class="{
									'bg-muted font-medium': selected?.name === entry.Line[0].name,
									'bg-amber-50 text-amber-900':
										selected?.name !== entry.Line[0].name &&
										(Array.isArray(facettingValues[entry.Line[0].name])
											? (facettingValues[entry.Line[0].name] as Array<string>).length > 0
											: Boolean(
													(facettingValues[entry.Line[0].name] as FacettingRegexSearch)?.value,
												)),
								}"
								@click="selected = entry.Line[0]"
							>
								<span>{{ entry.Line[0].name }}</span>
								<span class="text-xs text-muted-foreground">
									{{ entry.Line[0].label ?? "" }}
								</span>
							</button>
							<div v-if="entry.Line && entry.Line[0]?.name" class="px-4 pb-2">
								<template v-if="Array.isArray(facettingValues[entry.Line[0].name])">
									<div
										v-for="(val, index) of facettingValues[entry.Line[0].name] as Array<string>"
										:key="`${entry.Line[0].name}-${val}-${index}`"
										class="flex items-center justify-between gap-2 py-1 text-xs"
									>
										<span class="truncate text-muted-foreground">{{ val }}</span>
										<Button
											size="xs"
											variant="ghost"
											@click="removeFromSelection(entry.Line[0].name, index)"
										>
											{{ t("FacettingModal.actions.remove") }}
										</Button>
									</div>
								</template>
								<template
									v-else-if="(facettingValues[entry.Line[0].name] as FacettingRegexSearch)?.key"
								>
									<div class="flex items-center justify-between gap-2 py-1 text-xs">
										<Badge variant="outline">
											{{ (facettingValues[entry.Line[0].name] as FacettingRegexSearch).value }}
										</Badge>
										<Button size="xs" variant="ghost" @click="clearRegexSearch(entry.Line[0].name)">
											{{ t("FacettingModal.actions.clear") }}
										</Button>
									</div>
								</template>
							</div>
						</div>
					</div>
					<p v-else class="px-4 py-3 text-sm text-muted-foreground">
						{{ t("FacettingModal.messages.noTextTypes") }}
					</p>
				</div>
				<div class="flex-1 overflow-hidden">
					<div v-if="selected?.name" class="h-full p-4">
						<FacettingSelection
							:element="selected"
							:model-value="facettingValues[selected.name] ?? []"
							:query="props.query"
							@update:model-value="updateFacettingValues(selected.name, $event)"
						/>
					</div>
					<div v-else class="flex h-full items-center justify-center text-sm text-muted-foreground">
						{{ t("FacettingModal.messages.selectAttribute") }}
					</div>
				</div>
			</div>
		</DialogContent>
	</Dialog>
</template>
