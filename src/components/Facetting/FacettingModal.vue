<script lang="ts" setup>
import { useQuery } from "@tanstack/vue-query";

const props = defineProps<{ query: CorpusQuery }>();

const dialog = ref(true);

const emits = defineEmits(["close"]);

const api = useApiClient();

const t = useTranslations("Corpsum");

const { data } = useQuery({
	queryKey: ["get-texttypes-with-norms", props.query.corpus] as const,
	queryFn: async () => {
		const response = await api.search.getTextTypesWithNorms({
			corpname: props.query.corpus,
		});
		return response.data;
	},
});

const queryStore = useQueryStore();

const _query = ref(queryStore.queries.find((q) => q.id === props.query.id)!);

function removeFromSelection(name: string, index: number) {
	(_query.value.facettingValues[name] as unknown as Array<string>).splice(index, 1);
}
function clearRegexSearch(name: string) {
	_query.value.facettingValues[name] = [];
}

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

const selected: Ref<EntryLine | null> = ref(null);
</script>

<template>
	<VDialog v-model="dialog" persistent>
		<VCard class="size-full">
			<h1 class="flex justify-between p-2 text-xl">
				<span>
					{{ t("Facetting filters for") }}
					<span class="font-bold" :style="`color: ${query.color}`">{{ query.userInput }}</span>
				</span>
				<Button variant="outline" @click="emits('close')">close</Button>
			</h1>

			<div class="flex">
				<div v-if="data?.Blocks" class="ml-1 flex flex-col">
					<template v-for="entry of data.Blocks">
						<div v-if="entry.Line && entry.Line[0]?.name" :key="entry.Line[0]?.name">
							<button
								class="flex w-full justify-start px-1 text-lg"
								:class="{
									'bg-blue-300': selected?.name === entry.Line[0].name,
									'bg-yellow-100':
										selected?.name !== entry.Line[0].name &&
										((query.facettingValues[entry.Line[0].name] as unknown as Array<string>)
											?.length ||
											(query.facettingValues[entry.Line[0].name] as unknown as FacettingRegexSearch)
												?.value),
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
										class="flex w-full items-center justify-between bg-yellow-50 text-xs"
									>
										<span class="ml-3">
											{{ val }}
										</span>

										<Button
											class="rounded border border-solid"
											size="xs"
											variant="outline"
											@click="removeFromSelection(entry.Line[0].name, i)"
										>
											x
										</Button>
									</span>
								</template>
								<template
									v-if="
										(query.facettingValues[entry.Line[0].name] as unknown as FacettingRegexSearch)
											.key
									"
								>
									<span class="flex w-full items-center justify-between text-xs">
										<Badge variant="outline">
											{{
												(
													query.facettingValues[
														entry.Line[0].name
													] as unknown as FacettingRegexSearch
												).value
											}}
										</Badge>
										<Button
											size="xs"
											variant="outline"
											@click="clearRegexSearch(entry.Line[0].name)"
										>
											x
										</Button>
									</span>
								</template>
							</div>
						</div>
					</template>
				</div>
				<div v-if="selected" class="flex w-full flex-col border-l-2">
					<div v-if="selected?.name" class="w-full">
						<!-- {{ selected.name }} {{ selected.Values?.length }} -->
						<FacettingSelection
							v-model="_query.facettingValues[selected.name]"
							:element="selected"
							:query="_query"
						></FacettingSelection>
					</div>
				</div>
			</div>
		</VCard>
	</VDialog>
</template>
