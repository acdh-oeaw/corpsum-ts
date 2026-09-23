<script setup lang="ts">
import type { QueryListItem } from "~/server/api/queries.get.ts";

interface FacettingRegexSearch {
	key: string;
	value: string;
}
type FacettingValues = Record<string, Array<string> | FacettingRegexSearch>;

interface FacettingQueryContext {
	noske: string;
	corpus: string;
}

const props = defineProps<{
	open: boolean;
	query: FacettingQueryContext;
	currentQueryId?: string;
}>();

const emit = defineEmits<{
	(event: "update:open", value: boolean): void;
	(event: "update:modelValue", value: FacettingValues): void;
}>();

const t = useTranslations();
const auth = useAuth();
const selectedQuery = ref<QueryListItem | null>(null);
const overwriteOpen = ref(false);
const dialogOpen = computed({
	get: () => props.open,
	set: (value) => emit("update:open", value),
});

const {
	data: queries,
	pending,
	error,
} = useFetch<Array<QueryListItem>>("/api/queries", {
	default: () => [],
});

const matchingQueries = computed(() =>
	(queries.value ?? [])
		.filter((query) => query.owner.some((owner) => owner.username === auth.username))
		.filter(
			(query) =>
				query._id !== props.currentQueryId &&
				query.noske === props.query.noske &&
				query.corpus === props.query.corpus,
		)
		.sort((first, second) => first.name.localeCompare(second.name)),
);

function close() {
	emit("update:open", false);
}

function selectQuery(query: QueryListItem) {
	selectedQuery.value = query;
	overwriteOpen.value = true;
}

function applySelectedQuery() {
	if (!selectedQuery.value) return;
	const values = selectedQuery.value.facettingValues;
	emit(
		"update:modelValue",
		values && typeof values === "object" && !Array.isArray(values)
			? (values as FacettingValues)
			: {},
	);
	selectedQuery.value = null;
	overwriteOpen.value = false;
	close();
}
</script>

<template>
	<Dialog :open="dialogOpen" @update:open="dialogOpen = $event">
		<DialogContent class="max-h-[80vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>{{ t("FacettingCopy.title") }}</DialogTitle>
				<DialogDescription>{{ t("FacettingCopy.description") }}</DialogDescription>
			</DialogHeader>

			<div v-if="pending" class="py-6 text-sm text-muted-foreground">
				{{ t("FacettingCopy.messages.loading") }}
			</div>
			<p v-else-if="error" class="py-6 text-sm text-destructive" role="alert">
				{{ t("FacettingCopy.messages.error") }}
			</p>
			<p v-else-if="matchingQueries.length === 0" class="py-6 text-sm text-muted-foreground">
				{{ t("FacettingCopy.messages.empty") }}
			</p>
			<div v-else class="grid gap-2">
				<Button
					v-for="query in matchingQueries"
					:key="query._id"
					class="h-auto justify-start whitespace-normal text-left"
					variant="outline"
					@click="selectQuery(query)"
				>
					<span class="min-w-0 flex-1">
						<span class="block font-medium">{{ query.name }}</span>
						<span class="block text-xs font-normal text-muted-foreground">
							{{ query.type }} · {{ query.userInput }}
							<span v-if="query.subCorpus && query.subCorpus !== 'undefined'">
								· {{ query.subCorpus }}
							</span>
						</span>
					</span>
					<LucideIcon class="size-4 shrink-0" name="Copy" :stroke-width="2" />
				</Button>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" @click="close">
					{{ t("Actions.cancel") }}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>

	<AlertDialog v-model:open="overwriteOpen">
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>{{ t("FacettingCopy.overwriteTitle") }}</AlertDialogTitle>
				<AlertDialogDescription>
					{{ t("FacettingCopy.overwriteDescription") }}
				</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel @click="selectedQuery = null">
					{{ t("Actions.cancel") }}
				</AlertDialogCancel>
				<AlertDialogAction @click="applySelectedQuery">
					{{ t("FacettingCopy.actions.confirm") }}
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
</template>
