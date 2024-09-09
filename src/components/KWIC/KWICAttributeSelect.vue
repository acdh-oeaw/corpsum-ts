<script lang="ts" setup>
import { storeToRefs } from "pinia";

// const query = useQuery();
const corporaStore = useCorporaStore();
const { corpInfoResponse, corporaLoading } = storeToRefs(corporaStore);
const t = useTranslations("Corpsum");

const props = defineProps<{ query: CorpusQuery }>();

const queryStore = useQueryStore();

const _query = queryStore.queries.find((q) => q.id === props.query.id);
</script>

<template>
	<div v-if="!corporaLoading && corpInfoResponse">
		<h2 class="text-lg">{{ t("Attributes and Structures") }}</h2>
		<div v-if="_query" class="flex w-full flex-row justify-start gap-3 p-0">
			<VAutocomplete
				v-model="_query.KWICAttrsStructs.attributes"
				chips
				closable-chips
				dese
				item-title="name"
				:items="_query.KWICAttrsStructsOptions.attributes"
				:label="t('Attributes')"
				multiple
				placeholer="please select"
				return-object
			/>

			<VAutocomplete
				v-model="_query.KWICAttrsStructs.structures"
				chips
				closable-chips
				dese
				item-title="name"
				:items="_query.KWICAttrsStructsOptions.structures"
				:label="t('Structures')"
				multiple
				placeholer="please select"
				return-object
			/>
		</div>
	</div>
</template>
