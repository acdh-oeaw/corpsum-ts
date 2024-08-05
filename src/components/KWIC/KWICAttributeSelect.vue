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
				:label="t('Attributes')"
				return-object
				dese
				closable-chips
				placeholer="please select"
				chips
				multiple
				item-title="name"
				:items="_query.KWICAttrsStructsOptions.attributes"
			/>

			<VAutocomplete
				v-model="_query.KWICAttrsStructs.structures"
				:label="t('Structures')"
				return-object
				dese
				closable-chips
				placeholer="please select"
				chips
				multiple
				item-title="name"
				:items="_query.KWICAttrsStructsOptions.structures"
			/>
		</div>
	</div>
</template>
