<script lang="ts" setup>
import { VDataTable } from "vuetify/labs/VDataTable";

const props = defineProps<{ title: string }>();

const expand = ref(false);
</script>

<template>
	<VCard>
		<VCardItem :title="props.title">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				Display Component
			</template>
		</VCardItem>

		<VCardText class="py-0">
			<span>CONTENT</span>
		</VCardText>

		<VExpandTransition>
			<div v-if="expand">
				<VDataTable dense />
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
