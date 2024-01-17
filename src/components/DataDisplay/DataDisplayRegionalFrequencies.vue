<script lang="ts" setup>
import { storeToRefs } from "pinia";

const t = useTranslations("Corpsum");
const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const mode = ref("relative");
const expand = ref(false);
</script>

<template>
	<VCard>
		<VCardItem :title="t('RegionalFrequencies')">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				{{ t("RegionalFrequenciesDesc") }}
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<VBtnToggle v-model="mode" density="compact">
				<VBtn variant="outlined" value="absolute">{{ t("absolute") }}</VBtn>
				<VBtn variant="outlined" value="relative">{{ t("relative") }}</VBtn>
			</VBtnToggle>
			<div v-for="query of queries" :key="query.id">
				<div v-if="query.loading.regionalFrequencies">
					<VProgressCircular :color="query.color" indeterminate></VProgressCircular>
					<span :style="`color: ${query.color}`">
						{{ query.type }}: {{ query.userInput }}
						<CorpusChip :query="query" />
					</span>
				</div>
			</div>
			<div v-for="query of queries" :key="query.id">
				<div v-if="!query.loading.regionalFrequencies" class="mt-1">
					<span :style="`color: ${query.color}`">{{ query.type }}: {{ query.userInput }}</span>
					<CorpusChip :query="query" />
					<ClientOnly>
						<MapChart :query="query" :mode="mode" />
					</ClientOnly>
				</div>
			</div>
		</VCardText>

		<VExpandTransition v-if="expand">
			<DataDisplaySourceTable
				:queries="queries"
				datatype="regionalFrequencies"
			></DataDisplaySourceTable>
		</VExpandTransition>

		<VDivider></VDivider>

		<VCardActions>
			<VBtn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? t("ShowData") : t("HideData") }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>
