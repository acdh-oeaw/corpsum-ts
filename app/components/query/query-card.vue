<script setup lang="ts">
import type { QueryListItem } from "~/server/api/queries.get.ts";

const auth = useAuth();
const t = useTranslations();

const props = defineProps<{
	query: QueryListItem;
}>();
const emit = defineEmits<{
	(event: "deleted"): void;
}>();

const query = toRefs(props).query;
const isDeleting = ref(false);
const ownerNames = computed(() =>
	query.value.owner
		.map((owner) => owner.username || owner._id)
		.filter((ownerName) => ownerName.length > 0),
);
const isOwner = computed(() => query.value.owner.some((owner) => owner.username === auth.username));
const setDeleting = (value: boolean) => {
	isDeleting.value = value;
};

async function deleteQuery() {
	if (!isOwner.value || isDeleting.value) return;
	setDeleting(true);
	try {
		await $fetch(`/api/query/${query.value._id}`, { method: "DELETE" });
		emit("deleted");
	} finally {
		setDeleting(false);
	}
}
</script>

<template>
	<Card class="flex h-full w-[350px] flex-col">
		<CardHeader>
			<CardTitle>{{ query.name }}</CardTitle>
			<CardDescription>Corpus: {{ query.corpus }}</CardDescription>
		</CardHeader>
		<CardContent class="flex-1">
			<p><span class="text-xs">Type:</span> {{ query.type }}</p>
			<p><span class="text-xs">Sub corpus:</span> {{ query.subCorpus }}</p>
			<p><span class="text-xs">Owner:</span> {{ ownerNames.join(", ") }}</p>
			<p><span class="text-xs">Input:</span> {{ query.userInput }}</p>
		</CardContent>
		<CardFooter class="mt-auto w-full px-6 pb-6">
			<TooltipProvider :delay-duration="150">
				<div class="flex w-full flex-nowrap items-center gap-1 rounded-md border bg-muted/40 p-1">
					<Tooltip>
						<TooltipTrigger as-child>
							<Button v-if="isOwner" as-child class="flex-1" size="sm" variant="ghost">
								<NuxtLinkLocale :href="{ path: `/query/edit/${query._id}` }">
									<LucideIcon class="size-4" name="Pencil" :stroke-width="2" />
								</NuxtLinkLocale>
							</Button>
							<Button v-else class="flex-1" disabled size="sm" type="button" variant="ghost">
								<LucideIcon class="size-4" name="Pencil" :stroke-width="2" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{{ t("Actions.edit") }}</TooltipContent>
					</Tooltip>
					<AlertDialog>
						<Tooltip>
							<TooltipTrigger as-child>
								<AlertDialogTrigger as-child>
									<Button
										class="flex-1 text-destructive hover:text-destructive"
										:disabled="!isOwner || isDeleting"
										size="sm"
										variant="ghost"
									>
										<LucideIcon class="size-4" name="Trash2" :stroke-width="2" />
									</Button>
								</AlertDialogTrigger>
							</TooltipTrigger>
							<TooltipContent>{{ t("Actions.delete") }}</TooltipContent>
						</Tooltip>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{{ t("Dialogs.deleteQueryTitle") }}</AlertDialogTitle>
								<AlertDialogDescription>
									{{ t("Dialogs.deleteQueryDescription", { name: query.name }) }}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{{ t("Actions.cancel") }}</AlertDialogCancel>
								<AlertDialogAction :disabled="isDeleting" @click="deleteQuery">
									{{ t("Actions.delete") }}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
					<Tooltip>
						<TooltipTrigger as-child>
							<Button as-child class="flex-1" size="sm" variant="ghost">
								<NuxtLinkLocale :href="{ path: `/query/${query._id}` }">
									<LucideIcon class="size-4" name="Eye" :stroke-width="2" />
								</NuxtLinkLocale>
							</Button>
						</TooltipTrigger>
						<TooltipContent>{{ t("Actions.view") }}</TooltipContent>
					</Tooltip>
				</div>
			</TooltipProvider>
		</CardFooter>
	</Card>
</template>
