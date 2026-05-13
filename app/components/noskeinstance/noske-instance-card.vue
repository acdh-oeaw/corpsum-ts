<script setup lang="ts">
import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const auth = useAuth();
const t = useTranslations();

const props = defineProps<{
	hasCredentials?: boolean;
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
	<Card
		class="flex w-[350px] flex-col overflow-hidden rounded-sm border-2 border-primary/40 shadow-sm"
	>
		<CardHeader
			class="h-32 overflow-hidden border-b border-primary bg-primary text-primary-foreground"
		>
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<CardTitle class="truncate text-2xl font-black tracking-normal">
						{{ noskeInstance.name }}
					</CardTitle>
					<CardDescription class="truncate font-semibold text-primary-foreground/80">
						{{ t("NoskeInstanceCard.ownedBy") }}: {{ noskeInstance.owner.username }}
					</CardDescription>
				</div>
				<div class="flex min-h-12 shrink-0 flex-col items-end gap-1.5">
					<MetaBadge
						:label="t('NoskeInstanceCard.authentication')"
						tone="sky"
						:value="noskeInstance.authentication"
					>
						<template #icon>
							<LucideIcon class="size-3" name="ShieldCheck" :stroke-width="2" />
						</template>
					</MetaBadge>
					<MetaBadge
						v-if="noskeInstance.authentication === 'basic'"
						:label="t('Actions.credentials')"
						:tone="props.hasCredentials ? 'green' : 'red'"
						:value="
							props.hasCredentials
								? t('CredentialsPage.status.configured')
								: t('CredentialsPage.status.missing')
						"
					>
						<template #icon>
							<LucideIcon
								class="size-3"
								:name="props.hasCredentials ? 'KeyRound' : 'TriangleAlert'"
								:stroke-width="2"
							/>
						</template>
					</MetaBadge>
				</div>
			</div>
		</CardHeader>
		<CardContent class="flex-1 pt-4">
			<dl class="grid gap-2 text-sm">
				<div class="flex items-center justify-between gap-3">
					<dt class="text-xs text-muted-foreground">{{ t("NoskeInstanceCard.version") }}</dt>
					<dd class="truncate font-medium">{{ noskeInstance.version }}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-xs text-muted-foreground">{{ t("NoskeInstanceCard.host") }}</dt>
					<dd class="truncate font-medium">{{ noskeInstance.host }}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-xs text-muted-foreground">{{ t("NoskeInstanceCard.public") }}</dt>
					<dd class="truncate font-medium">
						{{ noskeInstance.public ? t("Common.yes") : t("Common.no") }}
					</dd>
				</div>
			</dl>
		</CardContent>
		<CardFooter class="mt-auto w-full border-t bg-muted/20 p-3">
			<TooltipProvider :delay-duration="150">
				<div class="flex w-full flex-nowrap items-center gap-1 rounded-md border bg-muted/40 p-1">
					<Tooltip v-if="noskeInstance.authentication === 'basic'">
						<TooltipTrigger as-child>
							<Button as-child class="flex-1" size="sm" variant="ghost">
								<NuxtLinkLocale :href="{ path: '/credentials' }">
									<LucideIcon class="size-4" name="LockKeyhole" :stroke-width="2" />
									<span class="sr-only">{{ t("Actions.credentials") }}</span>
								</NuxtLinkLocale>
							</Button>
						</TooltipTrigger>
						<TooltipContent>{{ t("Actions.credentials") }}</TooltipContent>
					</Tooltip>
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
