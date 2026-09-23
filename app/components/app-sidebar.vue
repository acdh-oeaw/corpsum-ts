<script setup lang="ts">
import { useSidebar } from "@/components/ui/sidebar";
import { colorSchemes } from "@/config/colorSchemes.config";
import { locales } from "@/config/i18n.config";

const NavItems = [
	{
		icon: "Database",
		tooltip: "Navigation.noSketchEngines",
		href: "/noskeinstances",
	},
	{
		icon: "Book",
		tooltip: "CorporaPage.title",
		href: "/corpora",
	},
	{
		icon: "Terminal",
		tooltip: "QueriesPage.title",
		href: "/queries",
	},
	{
		icon: "ChartLine",
		tooltip: "VisualizationsPage.title",
		href: "/visualizations",
	},
	{
		icon: "LayoutPanelTop",
		tooltip: "Navigation.publishedPanels",
		href: "/publishedpanels",
	},
];

const colorMode = useColorMode();
const t = useTranslations();

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
				<SidebarGroupLabel>{{ t("Navigation.platformFunctions") }}</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem v-for="(item, index) in NavItems" :key="index">
							<SidebarMenuButton as-child :tooltip="t(item.tooltip)">
								<NuxtLinkLocale :href="{ path: item.href }">
									<LucideIcon :name="item.icon" :stroke-width="2" />
									<span>{{ t(item.tooltip) }}</span>
								</NuxtLinkLocale>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<SidebarGroup class="mt-auto">
				<SidebarGroupLabel>{{ t("Navigation.settings") }}</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger>
									<SidebarMenuButton :tooltip="t('Navigation.colorScheme')">
										<LucideIcon name="Eclipse" :stroke-width="2" />
										<span>{{ t("Navigation.colorScheme") }}</span>
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
									<SidebarMenuButton :tooltip="t('Navigation.language')">
										<LucideIcon name="Globe" :stroke-width="2" />
										<span>{{ t("Navigation.language") }}</span>
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
							<SidebarMenuButton as-child :tooltip="t('Navigation.imprint')">
								<NuxtLinkLocale :href="{ path: '/imprint' }">
									<LucideIcon name="Scale" :stroke-width="2" />
									<span>{{ t("Navigation.imprint") }}</span>
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
