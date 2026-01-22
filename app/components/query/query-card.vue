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
		<CardFooter class="mt-auto flex flex-wrap gap-2 px-6 pb-6">
			<NuxtLinkLocale v-if="isOwner" :href="{ path: `/query/edit/${query._id}` }">
				<Button>{{ t("Actions.edit") }}</Button>
			</NuxtLinkLocale>
			<Button v-else disabled>{{ t("Actions.edit") }}</Button>
			<AlertDialog>
				<AlertDialogTrigger as-child>
					<Button :disabled="!isOwner || isDeleting" variant="destructive">
						{{ t("Actions.delete") }}
					</Button>
				</AlertDialogTrigger>
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
			<NuxtLinkLocale :href="{ path: `/query/${query._id}` }">
				<Button variant="outline">{{ t("Actions.view") }}</Button>
			</NuxtLinkLocale>
		</CardFooter>
	</Card>
</template>
