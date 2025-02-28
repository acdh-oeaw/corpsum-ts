<script setup lang="ts">
import { useSidebar } from "@/components/ui/sidebar";
import { colorSchemes } from "@/config/colorSchemes.config";
import { locales } from "@/config/i18n.config";

const NavItems = [
	{
		icon: "Database",
		tooltip: "NoSketch Engines",
		href: "/noskeinstances",
	},
	{
		icon: "Book",
		tooltip: "Corpora",
		href: "/corpora",
	},
	{
		icon: "Terminal",
		tooltip: "Queries",
		href: "/queries",
	},
	{
		icon: "ChartLine",
		tooltip: "Visualizations",
		href: "/visualizations",
	},
	{
		icon: "LayoutPanelTop",
		tooltip: "Published Panels",
		href: "/publishedpanels",
	},
];

const colorMode = useColorMode();

const currentLocale = useLocale();

const availableLocales = computed(() => {
	return locales.filter((locale) => locale !== currentLocale.value);
});

const switchLocalePath = useSwitchLocalePath();
const route = useRoute();

const { isMobile } = useSidebar();
</script>

<template>
	<Sidebar collapsible="icon">
		<SidebarHeader>
			<UserMenu />
		</SidebarHeader>
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>Platform Functions</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem v-for="(item, index) in NavItems" :key="index">
							<SidebarMenuButton as-child :tooltip="item.tooltip">
								<NuxtLinkLocale :href="{ path: item.href }">
									<LucideIcon :name="item.icon" :stroke-width="2" />
									<span>{{ item.tooltip }}</span>
								</NuxtLinkLocale>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<SidebarGroup class="mt-auto">
				<SidebarGroupLabel>Settings</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger>
									<SidebarMenuButton tooltip="Color Scheme">
										<LucideIcon name="Eclipse" :stroke-width="2" />
										<span>Color Scheme</span>
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									:align="isMobile ? 'end' : 'start'"
									class="w-48 rounded-lg"
									:side="isMobile ? 'bottom' : 'right'"
								>
									<DropdownMenuItem
										v-for="colorScheme of colorSchemes"
										:key="colorScheme.name"
										@click="colorMode.preference = colorScheme.name"
									>
										<LucideIcon
											class="text-muted-foreground"
											:name="colorScheme.icon"
											:stroke-width="2"
										/>
										<span>{{ colorScheme.name }}</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger>
									<SidebarMenuButton tooltip="Language">
										<LucideIcon name="Globe" :stroke-width="2" />
										<span>Language</span>
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									:align="isMobile ? 'end' : 'start'"
									class="w-48 rounded-lg"
									:side="isMobile ? 'bottom' : 'right'"
								>
									<div v-for="locale of availableLocales" :key="locale">
										<NuxtLinkLocale :href="{ path: switchLocalePath(locale), query: route.query }">
											<DropdownMenuItem>
												<span>{{ `Switch to ${locale.toUpperCase()}` }}</span>
											</DropdownMenuItem>
										</NuxtLinkLocale>
									</div>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton as-child tooltip="Imprint">
								<NuxtLinkLocale :href="{ path: '/imprint' }">
									<LucideIcon name="Scale" :stroke-width="2" />
									<span>Imprint</span>
								</NuxtLinkLocale>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
		<SidebarFooter></SidebarFooter>
		<SidebarRail />
	</Sidebar>
</template>
