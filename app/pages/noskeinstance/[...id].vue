<script setup lang="ts">
import type { components } from "~/lib/noske-types";

const route = useRoute();
const auth = useAuth();
const t = useTranslations();
const localeRoute = useLocaleRoute();
const locale = useLocale();
const formatDate = (value?: string | Date | null) => {
	if (!value) return "—";
	const date = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat(locale.value, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
};
const routeId = computed(() =>
	Array.isArray(route.params.id) ? (route.params.id[0] ?? null) : (route.params.id ?? null),
);
const { instance: noskeInstance, useNoskeQuery } = useNoskeClient(routeId);
const isOwner = computed(() => noskeInstance.value?.owner.username === auth.username);

type CorporaListItem = components["schemas"]["03_corpora_list"];

const corporaQuery = useNoskeQuery<Array<CorporaListItem>>({
	queryKey: computed(() => ["noske-corpora", routeId.value]),
	initialData: [],
	async queryFn(client) {
		const { data, error } = await client.GET("/ca/api/corpora");
		if (error) throw error;
		return data?.data ?? [];
	},
});
const corpora = computed<Array<CorporaListItem>>(() => corporaQuery.data.value ?? []);
const corporaPending = corporaQuery.isPending;

function formatCount(value?: number) {
	return typeof value === "number" ? value.toLocaleString() : "—";
}

function getCorpusQueryValue(corpus: CorporaListItem) {
	if (corpus.corpname) return corpus.corpname;
	return corpus.id != null ? String(corpus.id) : "";
}

const isDeleting = ref(false);
const setDeleting = (value: boolean) => {
	isDeleting.value = value;
};

async function deleteInstance() {
	if (!noskeInstance.value || !routeId.value || isDeleting.value) return;
	setDeleting(true);
	try {
		await $fetch(`/api/noskeinstances/${routeId.value}`, { method: "DELETE" });
		await navigateTo(localeRoute("/noskeinstances"));
	} finally {
		setDeleting(false);
	}
}
</script>

<template>
	<MainContent v-if="noskeInstance" class="mx-auto w-full max-w-5xl">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="Database" :stroke-width="2" />
				</div>
				<PageTitle>{{ noskeInstance.name }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button v-if="isOwner" as-child size="sm" variant="ghost">
					<NuxtLinkLocale :href="{ path: `/noskeinstance/edit/${noskeInstance._id}` }">
						<LucideIcon class="mr-1 size-4" name="Pencil" :stroke-width="2" />
						{{ t("Actions.edit") }}
					</NuxtLinkLocale>
				</Button>
				<Button v-else disabled size="sm" type="button" variant="ghost">
					<LucideIcon class="mr-1 size-4" name="Pencil" :stroke-width="2" />
					{{ t("Actions.edit") }}
				</Button>
				<AlertDialog>
					<AlertDialogTrigger as-child>
						<Button :disabled="!isOwner || isDeleting" size="sm" variant="ghost">
							<LucideIcon class="mr-1 size-4" name="Trash2" :stroke-width="2" />
							{{ t("Actions.delete") }}
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{{ t("Dialogs.deleteInstanceTitle") }}</AlertDialogTitle>
							<AlertDialogDescription>
								{{ t("Dialogs.deleteInstanceDescription", { name: noskeInstance.name }) }}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{{ t("Actions.cancel") }}</AlertDialogCancel>
							<AlertDialogAction :disabled="isDeleting" @click="deleteInstance">
								{{ t("Actions.delete") }}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
		<div class="mt-4 grid gap-6 lg:grid-cols-2">
			<div class="flex flex-col gap-3">
				<p><span class="text-xs">Host:</span> {{ noskeInstance.host }}</p>
				<p><span class="text-xs">Version:</span> {{ noskeInstance.version }}</p>
				<p><span class="text-xs">Public:</span> {{ noskeInstance.public ? "Yes" : "No" }}</p>
				<p>
					<span class="text-xs">{{ t("Common.createdAt") }}:</span>
					{{ formatDate(noskeInstance.createdAt) }}
				</p>
			</div>
			<div class="flex flex-col gap-3">
				<p><span class="text-xs">Authentication:</span> {{ noskeInstance.authentication }}</p>
				<p><span class="text-xs">Owned by:</span> {{ noskeInstance.owner.username }}</p>
				<p>
					<span class="text-xs">{{ t("Common.updatedAt") }}:</span>
					{{ formatDate(noskeInstance.updatedAt) }}
				</p>
			</div>
		</div>
		<div class="mt-8">
			<h2 class="text-lg font-semibold">Available corpora</h2>
			<p v-if="corporaPending" class="mt-2 text-sm text-muted-foreground">Loading corpora...</p>
			<div v-else class="mt-3 overflow-x-auto rounded-md border">
				<table class="min-w-full text-sm">
					<thead class="bg-muted/40 text-left">
						<tr>
							<th class="px-3 py-2 font-medium">Corpus</th>
							<th class="px-3 py-2 font-medium">Language</th>
							<th class="px-3 py-2 text-right font-medium">Words</th>
							<th class="px-3 py-2 text-right font-medium">Documents</th>
							<th class="px-3 py-2 text-right font-medium">Create query</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="corpus in corpora" :key="corpus.id ?? corpus.corpname">
							<td class="px-3 py-2">
								<p class="font-medium">{{ corpus.corpname ?? "—" }}</p>
								<p class="text-xs text-muted-foreground">{{ corpus.owner_name ?? "" }}</p>
							</td>
							<td class="px-3 py-2">
								<p>{{ corpus.language_name ?? "—" }}</p>
								<p class="text-xs text-muted-foreground">{{ corpus.language_id ?? "" }}</p>
							</td>
							<td class="px-3 py-2 text-right">{{ formatCount(corpus.sizes?.wordcount) }}</td>
							<td class="px-3 py-2 text-right">{{ formatCount(corpus.sizes?.doccount) }}</td>
							<td class="px-3 py-2 text-right">
								<Button v-if="getCorpusQueryValue(corpus)" as-child size="sm" variant="outline">
									<NuxtLinkLocale
										:href="{
											path: '/query/edit/new',
											query: {
												noske: noskeInstance._id,
												corpus: getCorpusQueryValue(corpus),
											},
										}"
									>
										{{ t("Actions.newQuery") }}
									</NuxtLinkLocale>
								</Button>
							</td>
						</tr>
						<tr v-if="corpora.length === 0">
							<td class="p-3 text-sm text-muted-foreground" colspan="5">
								No corpora found for this instance.
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</MainContent>
</template>
