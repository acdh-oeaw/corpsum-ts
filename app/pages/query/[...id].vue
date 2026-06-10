<script setup lang="ts">
import { createCopiedQueryName, queryCopyNameKey } from "@/utils/query-copy";
import type { QueryResponse } from "~/server/api/query/[id].get.ts";
import type { VisualizationListItem } from "~/server/api/visualizations.get.ts";

const route = useRoute();
const t = useTranslations();
const auth = useAuth();
const locale = useLocale();
const formatDate = (value?: string | Date) => {
	if (!value) return "—";
	const date = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat(locale.value, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
};

interface FacettingRegexSearch {
	key: string;
	value: string;
}
type FacettingValues = Record<string, Array<string> | FacettingRegexSearch>;

const queryId = computed(() => {
	const idParam = route.params.id;
	return Array.isArray(idParam) ? idParam[0] : idParam;
});

const { data: query } = await useFetch<QueryResponse>(() => `/api/query/${queryId.value}`);
const { data: visualizations } =
	await useFetch<Array<VisualizationListItem>>("/api/visualizations");

const ownerNames = computed(
	() =>
		query.value?.owner
			.map((owner) => owner.username || owner._id)
			.filter((ownerName) => ownerName.length > 0) ?? [],
);
const isOwner = computed(() =>
	query.value?.owner.some((owner) => owner.username === auth.username),
);

const facettingEntries = computed(() => {
	const values = (query.value?.facettingValues ?? {}) as FacettingValues;
	return Object.entries(values) as Array<[string, FacettingValues[string]]>;
});

const queryVisualizations = computed(() => {
	const id = query.value?._id ?? queryId.value ?? "";
	if (!id) return [];
	return (visualizations.value ?? []).filter((visualization) => visualization.queries.includes(id));
});

const copyQueryParams = computed(() => {
	if (!query.value) return {};
	return {
		name: createCopiedQueryName(
			query.value.name,
			t(queryCopyNameKey, { name: query.value.name }),
			locale.value,
		),
		noske: query.value.noske,
		corpus: query.value.corpus,
		subCorpus: query.value.subCorpus,
		type: query.value.type,
		userInput: query.value.userInput,
		facettingValues: JSON.stringify(query.value.facettingValues ?? {}),
	};
});
</script>

<template>
	<MainContent v-if="query" class="w-full min-w-0">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="Terminal" :stroke-width="2" />
				</div>
				<PageTitle>{{ query.name }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button v-if="isOwner" as-child size="sm" type="button" variant="ghost">
					<NuxtLinkLocale :href="{ path: `/query/edit/${query._id}` }">
						<LucideIcon class="mr-1 size-4" name="Pencil" :stroke-width="2" />
						{{ t("Actions.edit") }}
					</NuxtLinkLocale>
				</Button>
				<Button v-else disabled size="sm" type="button" variant="ghost">
					<LucideIcon class="mr-1 size-4" name="Pencil" :stroke-width="2" />
					{{ t("Actions.edit") }}
				</Button>
				<Button as-child size="sm" type="button" variant="ghost">
					<NuxtLinkLocale :href="{ path: '/query/edit/new', query: copyQueryParams }">
						<LucideIcon class="mr-1 size-4" name="Copy" :stroke-width="2" />
						{{ t("Actions.copy") }}
					</NuxtLinkLocale>
				</Button>
			</div>
		</div>
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="flex flex-col gap-3">
				<p><span class="text-xs">Type:</span> {{ query.type }}</p>
				<p><span class="text-xs">Corpus:</span> {{ query.corpus }}</p>
				<p><span class="text-xs">Sub corpus:</span> {{ query.subCorpus }}</p>
				<p><span class="text-xs">NoSketch Engine:</span> {{ query.noske }}</p>
				<p><span class="text-xs">Owners:</span> {{ ownerNames.join(", ") }}</p>
				<p>
					<span class="text-xs">{{ t("Common.createdAt") }}:</span>
					{{ formatDate(query.createdAt) }}
				</p>
				<p>
					<span class="text-xs">{{ t("Common.updatedAt") }}:</span>
					{{ formatDate(query.updatedAt) }}
				</p>
			</div>
			<div class="flex flex-col gap-4">
				<p v-if="query.type !== 'cqlrow'">
					<span class="text-xs">Input:</span> {{ query.userInput }}
				</p>
				<div v-else class="grid gap-2">
					<p class="text-xs">Input:</p>
					<CqlPrettyPrint :query="query.userInput" />
				</div>
				<div class="grid gap-2">
					<p class="text-xs">{{ t("QueryForm.labels.facettingValues") }}</p>
					<div class="w-full overflow-hidden rounded-md border">
						<table class="min-w-full text-sm">
							<thead class="bg-muted/40 text-left">
								<tr>
									<th class="px-3 py-2 font-medium">
										{{ t("QueryForm.table.attribute") }}
									</th>
									<th class="px-3 py-2 font-medium">
										{{ t("QueryForm.table.value") }}
									</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="[key, value] in facettingEntries" :key="key">
									<td class="px-3 py-2 font-medium">{{ key }}</td>
									<td class="px-3 py-2">
										<span v-if="Array.isArray(value)">
											{{ value.join(", ") || "—" }}
										</span>
										<span v-else>
											{{ value.value || "—" }}
										</span>
									</td>
								</tr>
								<tr v-if="facettingEntries.length === 0">
									<td class="px-3 py-2 text-sm text-muted-foreground" colspan="2">
										{{ t("QueryForm.messages.noFacettingValues") }}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
		<div class="mt-8 grid gap-2">
			<h2 class="text-lg font-semibold">Visualizations using this query</h2>
			<div class="w-full overflow-hidden rounded-md border">
				<table class="min-w-full text-sm">
					<thead class="bg-muted/40 text-left">
						<tr>
							<th class="px-3 py-2 font-medium">Visualization</th>
							<th class="px-3 py-2 font-medium">Charts</th>
							<th class="px-3 py-2 text-right font-medium">Action</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="visualization in queryVisualizations" :key="visualization._id">
							<td class="px-3 py-2 font-medium">
								<NuxtLinkLocale :href="{ path: `/visualization/${visualization._id}` }">
									{{ visualization.name }}
								</NuxtLinkLocale>
							</td>
							<td class="px-3 py-2">{{ visualization.visualizations.length }}</td>
							<td class="px-3 py-2 text-right">
								<Button as-child size="sm" variant="outline">
									<NuxtLinkLocale :href="{ path: `/visualization/${visualization._id}` }">
										View visualization
									</NuxtLinkLocale>
								</Button>
							</td>
						</tr>
						<tr v-if="queryVisualizations.length === 0">
							<td class="px-3 py-2 text-sm text-muted-foreground" colspan="3">
								No visualizations yet.
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</MainContent>
</template>
