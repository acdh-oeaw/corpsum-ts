<script lang="ts" setup>
import { convert } from "html-to-text";
import { computed, type Ref, ref, watch } from "vue";

import { useGetWideCtx } from "@/composables/useGetWideCtx.ts";
import { type HttpResponse, type Type16Widectx } from "~/lib/api-client";

const props = defineProps<{ kwic: KeywordInContext | null; query: CorpusQuery }>();
defineEmits(["close"]);
const active = computed(() => Boolean(props.kwic));

const isPending = ref(false);

const _data: Ref<HttpResponse<Type16Widectx, unknown>> | Ref<null> = ref(null);

function getDetails() {
	if (!props.kwic) return;
	return useGetWideCtx({
		corpname: props.query.corpus,
		pos: props.kwic.toknum,
		tokencount: 100,
	});
}

watch(active, async () => {
	if (!active.value) _data.value = null;
	if (!active.value || !props.kwic) return;
	getDetails();
});

const parsedText = computed(() => {
	//@ts-expect-error this is broken and will be rewritten
	if (!_data.value?.data?.content) return "not loaded yet.";
	//@ts-expect-error this is broken and will be rewritten
	const html = _data.value.data.content.map((a) => a.str).join(" ");
	const text = convert(html.replaceAll("</p>", "</p>\n\n"), { preserveNewlines: true });
	return text;
});
</script>

<template>
	<VDialog v-model="active">
		<VCard v-if="kwic">
			<VCardTitle>
				<span class="text-3xl">{{ kwic.docid }}</span>
			</VCardTitle>

			<VCardText>
				<VContainer>
					<!-- {{ kwic }} -->

					<!-- <p>
						{{ kwic.left }}
					</p>
					<p class="text-fuchsia-600">{{ kwic.word }}</p>
					<p>
						{{ kwic.right }}
					</p> -->

					<div v-if="!isPending">
						<TextHighlight :search-words="[kwic.word]" :text-to-highlight="parsedText" />

						<!-- <br />
						<br />
						<br />
						<br />
						<br /> -->
						<!-- {{ details }} -->
					</div>
					<VProgressCircular v-else indeterminate></VProgressCircular>

					<!-- <VCol cols="12" sm="6" md="4">
							<VTextField v-model="editedItem.name" label="Dessert name"></VTextField>
						</VCol>
						<VCol cols="12" sm="6" md="4">
							<VTextField v-model="editedItem.calories" label="Calories"></VTextField>
						</VCol>
						<VCol cols="12" sm="6" md="4">
							<VTextField v-model="editedItem.fat" label="Fat (g)"></VTextField>
						</VCol>
						<VCol cols="12" sm="6" md="4">
							<VTextField v-model="editedItem.carbs" label="Carbs (g)"></VTextField>
						</VCol>
						<VCol cols="12" sm="6" md="4">
							<VTextField v-model="editedItem.protein" label="Protein (g)"></VTextField>
						</VCol> -->
				</VContainer>
			</VCardText>

			<VCardActions>
				<VSpacer></VSpacer>
				<VBtn color="blue-darken-1" variant="text" @click="$emit('close')">close</VBtn>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
