<script lang="ts" setup>
import { VDataTable } from "vuetify/labs/VDataTable";

const props = defineProps<{ title: string }>();

const expand = ref(false);
</script>

<template>
	<v-card>
		<v-card-item :title="props.title">
			<template #subtitle>
				<!-- <v-icon icon="mdi-alert" size="18" color="error" class="me-1 pb-1"></v-icon> -->
				Display Component
			</template>
		</v-card-item>

		<v-card-text class="py-0">
			<span>CONTENT</span>
		</v-card-text>

		<v-expand-transition>
			<div v-if="expand">
				<v-data-table dense />
			</div>
		</v-expand-transition>

		<v-divider></v-divider>

		<v-card-actions>
			<v-btn variant="outlined" size="small" @click="expand = !expand">
				{{ !expand ? "Show Data" : "Hide Data" }}
			</v-btn>
		</v-card-actions>
	</v-card>
</template>
