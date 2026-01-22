<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const auth = useAuth();
const t = useTranslations();

const props = defineProps<{
	noskeInstance: PopulatedNoskeDocument;
}>();
const emit = defineEmits<{
	(event: "deleted"): void;
}>();

const noskeInstance = toRefs(props).noskeInstance;
const isDeleting = ref(false);
const isOwner = computed(() => noskeInstance.value.owner.username === auth.username);
const setDeleting = (value: boolean) => {
	isDeleting.value = value;
};

async function deleteInstance() {
	if (!isOwner.value || isDeleting.value) return;
	setDeleting(true);
	try {
		await $fetch(`/api/noskeinstances/${noskeInstance.value._id}`, { method: "DELETE" });
		emit("deleted");
	} finally {
		setDeleting(false);
	}
}
</script>

<template>
	<Card class="w-[350px]">
		<CardHeader>
			<CardTitle>{{ noskeInstance.name }}</CardTitle>
			<CardDescription> Owned by: {{ noskeInstance.owner.username }}</CardDescription>
		</CardHeader>
		<CardContent>
			<p><span class="text-xs">Version:</span> {{ noskeInstance.version }}</p>
			<p><span class="text-xs">Host:</span> {{ noskeInstance.host }}</p>
			<p><span class="text-xs">Public:</span> {{ noskeInstance.public ? "Yes" : "No" }}</p>
			<p><span class="text-xs">Authentication:</span> {{ noskeInstance.authentication }}</p>
		</CardContent>
		<CardFooter class="flex flex-wrap gap-2 px-6 pb-6">
			<Button v-if="isOwner" as-child>
				<NuxtLinkLocale :href="{ path: `/noskeinstance/edit/${noskeInstance._id}` }">
					{{ t("Actions.edit") }}
				</NuxtLinkLocale>
			</Button>
			<Button v-else disabled>{{ t("Actions.edit") }}</Button>
			<AlertDialog>
				<AlertDialogTrigger as-child>
					<Button :disabled="!isOwner || isDeleting" variant="destructive">
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
			<Button as-child variant="outline">
				<NuxtLinkLocale :href="{ path: `/noskeinstance/${noskeInstance._id}` }">
					{{ t("Actions.view") }}
				</NuxtLinkLocale>
			</Button>
		</CardFooter>
	</Card>
</template>
