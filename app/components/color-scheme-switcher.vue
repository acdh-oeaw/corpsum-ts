<script lang="ts" setup>
import { colorSchemes } from "@/config/colorSchemes.config";

const colorMode = useColorMode();
const t = useTranslations();
</script>

<template>
	<ClientOnly>
		<Select v-model="colorMode.preference" :aria-label="t('ColorSchemeToggle.change-color-scheme')">
			<SelectTrigger class="w-16">
				<SelectValue :placeholder="t('ColorSchemeToggle.change-color-scheme')" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectItem
						v-for="colorScheme of colorSchemes"
						:key="colorScheme.name"
						:value="colorScheme.name"
					>
						<LucideIcon :name="colorScheme.icon" :size="20" :stroke-width="2" />
					</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	</ClientOnly>
</template>
