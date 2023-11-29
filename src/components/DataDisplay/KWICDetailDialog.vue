<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{ kwic: KeywordInContext }>();
defineEmits(["close"]);

const active = computed(() => Boolean(props.kwic));
</script>

<template>
	<VDialog v-model="active" max-width="500px">
		<VCard v-if="kwic">
			<VCardTitle>
				<span class="text-h5">{{ kwic.word }}</span>
			</VCardTitle>

			<VCardText>
				<VContainer>
					<p>
						{{ kwic.left }}
					</p>
					<p class="text-fuchsia-600">{{ kwic.word }}</p>
					<p>
						{{ kwic.right }}
					</p>
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
