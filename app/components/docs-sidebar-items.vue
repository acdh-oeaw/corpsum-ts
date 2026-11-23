<script setup lang="ts">
import type { ContentNavigationItem } from "@nuxt/content";

import { useSidebar } from "@/components/ui/sidebar";
import { docsRoute } from "@/utils/docs-route";

defineProps<{ items: ContentNavigationItem[] }>();
const localePath = useLocalePath();
const route = useRoute();
const { setOpenMobile } = useSidebar();

function containsActive(item: ContentNavigationItem): boolean {
	return (
		route.path === localePath(docsRoute(item.path)) || Boolean(item.children?.some(containsActive))
	);
}
</script>

<template>
	<SidebarMenuSub>
		<SidebarMenuSubItem v-for="item in items" :key="item.path">
			<Collapsible
				v-if="item.children?.length"
				:key="String(containsActive(item))"
				:default-open="containsActive(item)"
			>
				<CollapsibleTrigger as-child>
					<SidebarMenuSubButton as="button" type="button">
						<LucideIcon name="ChevronRight" class="size-4" />
						<span>{{ item.title }}</span>
					</SidebarMenuSubButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<DocsSidebarItems :items="item.children" />
				</CollapsibleContent>
			</Collapsible>
			<SidebarMenuSubButton v-else as-child :is-active="containsActive(item)">
				<NuxtLinkLocale :to="docsRoute(item.path)" @click="setOpenMobile(false)">
					{{ item.title }}
				</NuxtLinkLocale>
			</SidebarMenuSubButton>
		</SidebarMenuSubItem>
	</SidebarMenuSub>
</template>
