<script lang="ts" setup>
import { colorSchemes } from "@/config/colorSchemes.config";

const colorMode = useColorMode();
</script>

<template>
	<ClientOnly>
		<Select v-model="colorMode.preference" aria-label="Select Color Scheme">
			<SelectTrigger class="w-15">
				<SelectValue placeholder="Select Color Scheme" />
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
