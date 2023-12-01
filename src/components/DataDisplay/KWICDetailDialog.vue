<script lang="ts" setup>
import { convert } from "html-to-text";
import { computed, type Ref, ref, watch } from "vue";

import { useAPIs } from "../../composables/useAPIs";
import { useAuthenticatedFetch } from "../../composables/useAuthenticatedFetch";

const props = defineProps<{ kwic: KeywordInContext | null }>();
defineEmits(["close"]);
const { STRUCTCTX_URL } = useAPIs();
const active = computed(() => Boolean(props.kwic));
const corporaStore = useCorporaStore();
const { corporaForSearch } = storeToRefs(corporaStore);
const { authenticatedFetch } = useAuthenticatedFetch();

const loading = ref(false);

// todo: better type this
const details: Ref<StructCtxDocumentResponse | null> = ref(null);

async function getDetails() {
	loading.value = true;
	details.value = null;
	const { data: _details } = await authenticatedFetch(STRUCTCTX_URL, {
		params: {
			q: `${corporaForSearch.value};pos=${props.kwic.toknum};struct=doc;format=json`,
		},
	});
	loading.value = false;

	details.value = _details.value;
}

watch(active, async () => {
	if (!active.value) details.value = null;
	if (!active.value || !props.kwic) return;
	await getDetails();
});

const parsedText = computed(() => {
	if (!details.value) return "not loaded yet, lol";

	const html = details.value.content.map((a) => a.str).join(" ");
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

					<div v-if="!loading">
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
