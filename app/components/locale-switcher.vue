<script lang="ts" setup>
import { locales } from "@/config/i18n.config";

const currentLocale = useLocale();
const switchLocalePath = useSwitchLocalePath();
const route = useRoute();
</script>

<template>
	<TooltipProvider v-for="locale of locales" :key="locale">
		<Tooltip v-if="locale !== currentLocale">
			<TooltipTrigger as-child>
				<NuxtLinkLocale :href="{ path: switchLocalePath(locale), query: route.query }">
					<Button
						:aria-label="`Switch to ${locale}`"
						class="rounded-md"
						size="icon"
						variant="ghost"
					>
						{{ locale.toUpperCase() }}
					</Button>
				</NuxtLinkLocale>
			</TooltipTrigger>
			<TooltipContent side="right" :side-offset="5">
				{{ `Switch to ${locale.toUpperCase()}` }}
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
</template>
