<script lang="ts" setup>
import { convert } from "html-to-text";
import { computed, type Ref, ref, watch } from "vue";

import { useAPIs } from "../../composables/useAPIs";
import { useAuthenticatedFetch } from "../../composables/useAuthenticatedFetch";

const props = defineProps<{ kwic: KeywordInContext | null; query: CorpusQuery }>();
defineEmits(["close"]);
const { FULL_REF_URL } = useAPIs();
const active = computed(() => Boolean(props.kwic));
const queryStore = useQuery();

const { authenticatedFetch } = useAuthenticatedFetch();

const loading = ref(false);

// todo: better type this
const details: Ref<StructCtxDocumentResponse | null> = ref(null);

async function getDetails() {
	if (!props.kwic) return;
	loading.value = true;
	details.value = null;
	const { data: _details } = await authenticatedFetch(FULL_REF_URL, {
		params: {
			pos: props.kwic.toknum,
			corpname: props.query.corpus,
		},
	});
	loading.value = false;

	details.value = _details.value as StructCtxDocumentResponse;
}

watch(active, async () => {
	if (!active.value) details.value = null;
	if (!active.value || !props.kwic) return;
	await getDetails();
});

// const parsedText = computed(() => {
// 	if (!details.value?.content) return "not loaded yet.";
// 	const html = details.value.content.map((a) => a.str).join(" ");
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
					<div v-if="!loading">
						<!-- <TextHighlight :search-words="[kwic.word]" :text-to-highlight="parsedText" /> -->
					</div>

					<div v-if="loading">
						<VProgressCircular indeterminate></VProgressCircular>
						<span>Loading the full ref</span>
					</div>
					<JsonViewer v-if="!loading" :expand-depth="2" :value="details"></JsonViewer>
				</VContainer>
			</VCardText>

			<VCardActions>
				<VSpacer></VSpacer>
				<VBtn color="blue-darken-1" variant="text" @click="$emit('close')">close</VBtn>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
