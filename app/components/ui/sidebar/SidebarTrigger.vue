<script setup lang="ts">
import { PanelLeft } from "lucide-vue-next";
import type { HTMLAttributes } from "vue";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useSidebar } from "./utils";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
const t = useTranslations();

const { toggleSidebar } = useSidebar();
</script>

<template>
	<Button
		:class="cn('size-7', props.class)"
		data-sidebar="trigger"
		size="icon"
		variant="ghost"
		@click="toggleSidebar"
	>
		<PanelLeft />
		<span class="sr-only">{{ t("Accessibility.toggleSidebar") }}</span>
	</Button>
</template>
