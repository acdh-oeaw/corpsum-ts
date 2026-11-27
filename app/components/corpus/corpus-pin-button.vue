<script setup lang="ts">
const props = defineProps<{ instanceId: string; corpus: string }>();
const t = useTranslations();
const { isPinned, toggle, pending } = usePinnedCorpora();
const error = ref(false);
const pinned = computed(() => isPinned(props.instanceId, props.corpus));
const label = computed(() => t(pinned.value ? "CorpusPin.unpin" : "CorpusPin.pin"));
async function onToggle() {
	error.value = false;
	try {
		await toggle(props.instanceId, props.corpus);
	} catch {
		error.value = true;
	}
}
</script>
<template>
	<TooltipProvider :delay-duration="150"
		><Tooltip
			><TooltipTrigger as-child>
				<Button
					size="sm"
					variant="ghost"
					:disabled="!corpus || pending[`${instanceId}:${corpus}`]"
					:aria-label="label"
					:aria-pressed="pinned"
					@click="onToggle"
					><LucideIcon :name="pinned ? 'PinOff' : 'Pin'" class="size-4" :stroke-width="2"
				/></Button> </TooltipTrigger
			><TooltipContent>{{ label }}</TooltipContent></Tooltip
		></TooltipProvider
	>
	<span v-if="error" role="alert" class="text-sm text-destructive">{{ t("CorpusPin.error") }}</span>
</template>
