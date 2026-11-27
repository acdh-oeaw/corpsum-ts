<script setup>
import * as icons from "lucide-vue-next";
import { computed } from "vue";

const props = defineProps({
	name: {
		type: String,
		required: true,
	},
	size: Number,
	color: String,
	strokeWidth: Number,
	defaultClass: String,
});

// @ts-expect-error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type.
const icon = computed(() => icons[props.name]);
</script>

<template>
	<component
		:is="icon"
		:color="color"
		:default-class="defaultClass"
		:size="size"
		:stroke-width="strokeWidth"
	/>
</template>
