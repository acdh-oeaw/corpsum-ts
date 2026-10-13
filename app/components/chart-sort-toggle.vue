<script setup lang="ts">
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-vue-next";

import { useTranslations } from "@/composables/use-translations";

import { ToolbarToggleGroup, ToolbarToggleItem } from "./ui/toolbar";

const sortOrder = defineModel<"ascending" | "descending">({ default: "descending" });
const t = useTranslations();
</script>

<template>
	<ToolbarToggleGroup
		v-model="sortOrder"
		:aria-label="t('Chart.sortOrder')"
		class="h-8 rounded-md border border-input bg-background p-0.5 shadow-sm"
		type="single"
	>
		<ToolbarToggleItem
			:aria-label="t('Chart.sortAscending')"
			class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
			value="ascending"
		>
			<ArrowUpWideNarrow />
		</ToolbarToggleItem>
		<ToolbarToggleItem
			:aria-label="t('Chart.sortDescending')"
			class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
			value="descending"
		>
			<ArrowDownWideNarrow />
		</ToolbarToggleItem>
	</ToolbarToggleGroup>
</template>
