<script lang="ts" setup>
import { Loader2 } from "lucide-vue-next";

const props = defineProps<{ kwic: KeywordInContext; query: CorpusQuery }>();
const emit = defineEmits(["close"]);

const open = computed({
	get: () => Boolean(props.kwic),
	set: (value: boolean) => {
		if (!value) emit("close");
	},
});

const { data: details, status } = useGetWideCtx({
	corpname: props.query.corpus,
	pos: props.kwic.toknum,
	tokencount: 100,
	noske: props.query.noske ?? null,
});

const t = useTranslations();
</script>

<template>
	<Dialog :open="open" @update:open="open = $event">
		<DialogContent class="max-w-2xl">
			<DialogHeader>
				<DialogTitle class="text-2xl">
					{{ kwic.docid }}
				</DialogTitle>
			</DialogHeader>

			<div class="grid grid-cols-[1fr_auto_1fr] gap-8 items-center">
				<span class="text-right">{{ kwic.left }}</span>
				<span class="font-semibold">{{ kwic.word }}</span>
				<span>{{ kwic.right }}</span>
			</div>

			<div class="mt-4">
				<div v-if="status === 'pending'" class="flex items-center gap-2">
					<Loader2 class="size-4 animate-spin" />
					<span>{{ t("loading-the-full-ref") }}</span>
				</div>
				<div v-else-if="details?.Refs?.length" class="space-y-2">
					<div v-for="ref of details.Refs" :key="ref.id" class="flex justify-between">
						<span>{{ ref.name }}</span>
						<span>{{ ref.val }}</span>
					</div>
				</div>
			</div>

			<DialogFooter>
				<Button variant="outline" @click="open = false">{{ t("close") }}</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
