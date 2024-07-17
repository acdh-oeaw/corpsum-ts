<script lang="ts" setup>
import { convert } from "html-to-text";
import { computed, type Ref, ref, watch } from "vue";

import { useGetWideCtx } from "@/composables/useGetWideCtx.ts";
import type { HttpResponse, Type16Widectx } from "~/lib/api-client";

const props = defineProps<{ kwic: KeywordInContext; query: CorpusQuery }>();
defineEmits(["close"]);
const active = computed(() => Boolean(props.kwic));

// const _data: Ref<HttpResponse<Type16Widectx, unknown>> | Ref<null> = ref(null);

const { data: details, status } = useGetWideCtx({
	corpname: props.query.corpus,
	pos: props.kwic.toknum,
	tokencount: 100,
});

// const parsedText = computed(() => {
// 	if (!data.value?.data?.content) return "not loaded yet.";
// 	const html = data.value.data.content.map((a) => a.str).join(" ");
// 	const text = convert(html.replaceAll("</p>", "</p>\n\n"), { preserveNewlines: true });
// 	return text;
// });
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

					<div v-if="status !== 'pending'">
						<!-- <TextHighlight :search-words="[kwic.word]" :text-to-highlight="parsedText" /> -->

						<!-- <br />
						<br />
						<br />
						<br />
						<br /> -->
						<!-- {{ details }} -->
					</div>
					<div v-if="status === 'pending'">
						<VProgressCircular indeterminate></VProgressCircular>
						<span>Loading the full ref</span>
					</div>
					<JsonViewer v-else :expand-depth="2" :value="details"></JsonViewer>
				</VContainer>
			</VCardText>

			<VCardActions>
				<VSpacer></VSpacer>
				<VBtn color="blue-darken-1" variant="text" @click="$emit('close')">close</VBtn>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
