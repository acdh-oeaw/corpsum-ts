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

const corporaQueryKey = computed(() => ["noske-corpora", routeId.value]);
const { metadata: corporaCache } = useNoskeCacheMetadata(corporaQueryKey);
const corporaQuery = useNoskeQuery<Array<CorporaListItem>>({
	queryKey: corporaQueryKey,
	async queryFn(client) {
		const { data, error } = await client.GET("/ca/api/corpora");
		if (error) throw error;
		return data?.data ?? [];
	},
});
const corpora = computed(() =>
	(corporaQuery.isPlaceholderData.value ? [] : (corporaQuery.data.value ?? [])).map((corpus) => ({
		...corpus,
		noskeId: noskeInstance.value?._id ?? "",
		baseUrl: noskeInstance.value?.base ?? "",
	})),
);
const { isFetching: corporaFetching, isError: corporaFailed } = corporaQuery;
const corporaLoading = computed(() => corporaFetching.value || corporaQuery.isPending.value);
const corporaStatus = computed(() => {
	if (corporaLoading.value) return t("NoskeInstanceDetail.loadingCorpora");
	if (corporaFailed.value) return t("NoskeInstanceDetail.corporaFailed");
	return t("NoskeInstanceDetail.corporaLoaded", { count: corpora.value.length });
});

const isDeleting = ref(false);
const setDeleting = (value: boolean) => {
	isDeleting.value = value;
};

async function deleteInstance() {
	if (!noskeInstance.value || !routeId.value || isDeleting.value) return;
	setDeleting(true);
	try {
		await $fetch(`/api/noskeinstances/${routeId.value}`, { method: "DELETE" });
		await navigateTo(localeRoute({ path: "/noskeinstances" }));
	} finally {
		setDeleting(false);
	}
}
</script>

<template>
	<MainContent v-if="noskeInstance" class="w-full min-w-0">
		<div class="my-10 flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-3">
				<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
					<LucideIcon class="size-8 text-foreground" name="Database" :stroke-width="2" />
				</div>
				<PageTitle>{{ noskeInstance.name }}</PageTitle>
			</div>
			<div class="inline-flex items-center gap-1 rounded-md border bg-muted/40 p-1">
				<Button v-if="noskeInstance.authentication === 'basic'" as-child size="sm" variant="ghost">
					<NuxtLinkLocale :href="{ path: '/credentials' }">
						<LucideIcon class="size-4" name="LockKeyhole" :stroke-width="2" />
						<span class="sr-only">{{ t("Actions.credentials") }}</span>
					</NuxtLinkLocale>
				</Button>
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
				<p>
					<span class="text-xs">{{ t("NoskeInstanceCard.host") }}:</span> {{ noskeInstance.host }}
				</p>
				<p>
					<span class="text-xs">{{ t("NoskeInstanceCard.version") }}:</span>
					{{ noskeInstance.version }}
				</p>
				<p>
					<span class="text-xs">{{ t("NoskeInstanceCard.public") }}:</span>
					{{ noskeInstance.public ? t("Common.yes") : t("Common.no") }}
				</p>
				<p>
					<span class="text-xs">{{ t("Common.createdAt") }}:</span>
					{{ formatDate(noskeInstance.createdAt) }}
				</p>
			</div>
			<div class="flex flex-col gap-3">
				<p>
					<span class="text-xs">{{ t("NoskeInstanceCard.authentication") }}:</span>
					{{ noskeInstance.authentication }}
				</p>
				<p>
					<span class="text-xs">{{ t("NoskeInstanceCard.ownedBy") }}:</span>
					{{ noskeInstance.owner.username }}
				</p>
				<p>
					<span class="text-xs">{{ t("Common.updatedAt") }}:</span>
					{{ formatDate(noskeInstance.updatedAt) }}
				</p>
			</div>
		</div>
		<div class="mt-8">
			<h2 class="text-lg font-semibold">{{ t("NoskeInstanceDetail.availableCorpora") }}</h2>
			<CorpusTable
				:corpora="corpora"
				:loading="corporaLoading"
				:failed="corporaFailed"
				show-detail-status
			>
				<template #status>
					<CorpusRequestStatus
						:label="corporaStatus"
						:loading="corporaLoading"
						:failed="corporaFailed && !corporaLoading"
						:cache="corporaCache"
					/>
				</template>
			</CorpusTable>
		</div>
	</MainContent>
</template>
