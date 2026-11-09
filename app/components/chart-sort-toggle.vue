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
		<TooltipProvider
			><Tooltip
				><TooltipTrigger as-child
					><ToolbarToggleItem
						:aria-label="t('Chart.sortAscending')"
						class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
						value="ascending"
					>
						<ArrowUpWideNarrow /> </ToolbarToggleItem></TooltipTrigger
				><TooltipContent>{{ t("Chart.sortAscending") }}</TooltipContent></Tooltip
			>
			<Tooltip
				><TooltipTrigger as-child
					><ToolbarToggleItem
						:aria-label="t('Chart.sortDescending')"
						class="h-7 min-w-7 rounded-sm px-1.5 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-primary/40"
						value="descending"
					>
						<ArrowDownWideNarrow /> </ToolbarToggleItem></TooltipTrigger
				><TooltipContent>{{ t("Chart.sortDescending") }}</TooltipContent></Tooltip
			></TooltipProvider
		>
	</ToolbarToggleGroup>
</template>
