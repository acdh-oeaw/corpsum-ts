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
