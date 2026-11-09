<script setup lang="ts">
import { useTranslations } from "@/composables/use-translations";

const rowLimit = defineModel<number>({ required: true });
const t = useTranslations();
const rowLimitOptions = [5, 10, 15, 20, 25, 30];
</script>

<template>
	<TooltipProvider
		><Tooltip
			><TooltipTrigger as-child
				><span class="inline-flex"
					><Select v-model="rowLimit">
						<SelectTrigger class="h-8 w-28" :aria-label="t('Chart.rowsToInclude')">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem v-for="count in rowLimitOptions" :key="count" :value="count">
								{{ t("Chart.rowCount", { count }) }}
							</SelectItem>
						</SelectContent>
					</Select></span
				></TooltipTrigger
			><TooltipContent>{{ t("Chart.rowsToInclude") }}</TooltipContent></Tooltip
		></TooltipProvider
	>
</template>
