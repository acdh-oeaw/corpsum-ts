<script setup lang="ts">
import { docsRoute } from "@/utils/docs-route";

defineProps<{ slug: string }>();

const t = useTranslations();
const localePath = useLocalePath();
</script>

<template>
	<TooltipProvider :delay-duration="150">
		<Tooltip>
			<TooltipTrigger as-child>
				<NuxtLink
					:to="localePath(docsRoute('/docs/' + slug), 'de')"
					:aria-label="t('Documentation.title')"
					class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
				>
					<LucideIcon name="Info" class="size-5" aria-hidden="true" />
				</NuxtLink>
			</TooltipTrigger>
			<TooltipContent>{{ t("Documentation.title") }}</TooltipContent>
		</Tooltip>
	</TooltipProvider>
</template>
