<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { VDataTable } from "vuetify/labs/VDataTable";

const queryStore = useQuery();
const { queries } = storeToRefs(queryStore);

const expand = ref(false);
</script>

<template>
	<VCard>
		<VCardItem title="Word Form Frequencies">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				shows absolute and relative Values.
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<span>Graph goes here</span>
		</VCardText>

		<VExpandTransition v-if="expand">
			<div>
				{{ queries.length }}
				<div v-for="query of queries" :key="query.id">
					<div v-if="!query.loading.formFrequencies">
						<span>{{ query.finalQuery }}</span>
						<VDataTable :data="query.data.wordFormFrequencies" dense />
						{{ query.data.wordFormFrequencies }}
					</div>
					<VProgressCircular v-else indeterminate></VProgressCircular>
				</div>
			</div>
		</VExpandTransition>

		<VDivider></VDivider>

		<VCardActions>
			<VBtn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? "Show Data" : "Hide Data" }}
			</VBtn>
		</VCardActions>
	</VCard>
</template>
