<script setup lang="ts">
import { useSidebar } from "@/components/ui/sidebar";
import { colorSchemes } from "@/config/colorSchemes.config";
import { locales } from "@/config/i18n.config";
import { docsRoute } from "@/utils/docs-route";

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

const { isMobile, open, setOpen, setOpenMobile } = useSidebar();
const docsCollection = useDocsCollection();
const localePath = useLocalePath();
const docsPath = computed(() => localePath(docsRoute()));
const inDocs = computed(
	() => route.path === docsPath.value || route.path.startsWith(docsPath.value + "/"),
);
const docsExpanded = ref(false);
const docsTreeId = useId();

function toggleDocumentation() {
	if (!isMobile.value && !open.value) {
		setOpen(true);
		docsExpanded.value = true;
		return;
	}
	docsExpanded.value = !docsExpanded.value;
}
watch(
	[inDocs, () => route.path],
	() => {
		if (inDocs.value) docsExpanded.value = true;
	},
	{ immediate: true },
);

const { data: docsNavigation } = await useAsyncData(
	computed(() => `navigation:${docsCollection.value}`),
	() =>
		queryCollectionNavigation(docsCollection.value)
			.order("navigationOrder", "ASC")
			.order("stem", "ASC"),
);
const docsItems = computed(() => {
	const localeRoot = docsNavigation.value?.find((item) => item.path === `/${currentLocale.value}`);
	const docsRoot = localeRoot?.children?.find((item) => item.path === docsPath.value);
	return docsRoot?.children?.filter((item) => item.path !== docsPath.value) ?? [];
});

async function switchDocumentationLocale(locale: "en" | "de") {
	const path = route.path.slice(docsPath.value.length);
	const page = await queryCollection(locale === "de" ? "docsDe" : "docsEn")
		.path(localePath(docsRoute(), locale) + path.replace(/\/$/, ""))
		.first();
	await navigateTo(page ? switchLocalePath(locale) : localePath(docsRoute(), locale));
	setOpenMobile(false);
}
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
						<SidebarMenuItem>
							<Collapsible v-model:open="docsExpanded">
								<SidebarMenuButton
									:is-active="inDocs"
									:tooltip="t('Documentation.title')"
									:aria-controls="docsTreeId"
									:aria-expanded="docsExpanded"
									@click="toggleDocumentation"
								>
									<LucideIcon name="BookOpen" :stroke-width="2" />
									<span>{{ t("Documentation.title") }}</span>
									<LucideIcon
										name="ChevronRight"
										class="ml-auto"
										:class="{ 'rotate-90': docsExpanded }"
									/>
								</SidebarMenuButton>
								<CollapsibleContent :id="docsTreeId">
									<SidebarMenuSub>
										<SidebarMenuSubItem>
											<SidebarMenuSubButton as-child :is-active="route.path === docsPath">
												<NuxtLinkLocale :to="docsRoute()" @click="setOpenMobile(false)">
													{{ t("Documentation.overview") }}
												</NuxtLinkLocale>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									</SidebarMenuSub>
									<DocsSidebarItems :items="docsItems" />
								</CollapsibleContent>
							</Collapsible>
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
								<DropdownMenuTrigger as-child>
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
								<DropdownMenuTrigger as-child>
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
										<DropdownMenuItem v-if="inDocs" @select="switchDocumentationLocale(locale)">
											<span>{{ `Switch to ${locale.toUpperCase()}` }}</span>
										</DropdownMenuItem>
										<NuxtLinkLocale
											v-else
											:href="{ path: switchLocalePath(locale), query: route.query }"
										>
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
