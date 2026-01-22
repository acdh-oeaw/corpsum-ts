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
			<CardDescription>
				{{ t("NoskeInstanceCard.ownedBy") }}: {{ noskeInstance.owner.username }}
			</CardDescription>
		</CardHeader>
		<CardContent>
			<p>
				<span class="text-xs">{{ t("NoskeInstanceCard.version") }}:</span>
				{{ noskeInstance.version }}
			</p>
			<p>
				<span class="text-xs">{{ t("NoskeInstanceCard.host") }}:</span> {{ noskeInstance.host }}
			</p>
			<p>
				<span class="text-xs">{{ t("NoskeInstanceCard.public") }}:</span>
				{{ noskeInstance.public ? t("Common.yes") : t("Common.no") }}
			</p>
			<p>
				<span class="text-xs">{{ t("NoskeInstanceCard.authentication") }}:</span>
				{{ noskeInstance.authentication }}
			</p>
		</CardContent>
		<CardFooter class="w-full px-6 pb-6">
			<TooltipProvider :delay-duration="150">
				<div class="flex w-full flex-nowrap items-center gap-1 rounded-md border bg-muted/40 p-1">
					<Tooltip>
						<TooltipTrigger as-child>
							<Button v-if="isOwner" as-child class="flex-1" size="sm" variant="ghost">
								<NuxtLinkLocale :href="{ path: `/noskeinstance/edit/${noskeInstance._id}` }">
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
					<Tooltip>
						<TooltipTrigger as-child>
							<Button as-child class="flex-1" size="sm" variant="ghost">
								<NuxtLinkLocale :href="{ path: `/noskeinstance/${noskeInstance._id}` }">
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
