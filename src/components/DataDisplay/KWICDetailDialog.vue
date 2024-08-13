<script lang="ts" setup>
import { computed } from "vue";

import { useGetWideCtx } from "@/composables/useGetWideCtx.ts";

const props = defineProps<{ kwic: KeywordInContext; query: CorpusQuery }>();
defineEmits(["close"]);
const active = computed(() => Boolean(props.kwic));

const { data: details, status } = useGetWideCtx({
	corpname: props.query.corpus,
	pos: props.kwic.toknum,
	tokencount: 100,
});
</script>

<template>
	<VDialog v-model="active">
		<VCard v-if="kwic">
			<VCardTitle>
				<span class="text-3xl">{{ kwic.docid }}</span>
			</VCardTitle>

			<VCardText>
				<div class="flex gap-2">
					{{ kwic.left }}
					<span class="font-semibold">{{ kwic.word }}</span>
					{{ kwic.right }}
				</div>
				<VContainer>
					<div v-if="status === 'pending'">
						<VProgressCircular indeterminate></VProgressCircular>
						<span>Loading the full ref</span>
					</div>
					<!-- <JsonViewer v-if="status !== 'pending'" :expand-depth="2" :value="details"></JsonViewer> -->
					<div v-if="status !== 'pending'">
						<div
							v-for="ref of details.data.Refs"
							:key="ref.id"
							class="flex w-[40rem] justify-between"
						>
							<span>{{ ref.name }}</span>
							<span>{{ ref.val }}</span>
						</div>
					</div>
				</VContainer>
			</VCardText>

			<VCardActions>
				<VSpacer></VSpacer>
				<VBtn color="blue-darken-1" variant="text" @click="$emit('close')">close</VBtn>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
