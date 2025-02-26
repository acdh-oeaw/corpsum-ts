<script setup lang="ts">
const NavItems = [
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
];
const localeRoute = useLocaleRoute();
const { locale } = useI18n();

const auth = useAuth();

const logout = async () => {
	await auth.logout();
	return await navigateTo(localeRoute("/login", locale.value));
};
</script>

<template>
	<Sidebar collapsible="icon">
		<SidebarHeader>
			<NuxtLinkLocale :href="{ path: '/' }">
				<div class="flex justify-center border-b p-2">
					<Button aria-label="Home" size="icon" variant="ghost"> CS</Button>
				</div>
			</NuxtLinkLocale>
		</SidebarHeader>
		<SidebarContent>
			<SidebarGroupLabel>Query Functions</SidebarGroupLabel>
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
			<nav class="mt-auto grid gap-1 p-2">
				<ColorSchemeSwitcher></ColorSchemeSwitcher>
				<div class="flex justify-center">
					<LocaleSwitcher></LocaleSwitcher>
				</div>
				<div class="flex justify-center">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger as-child>
								<Button
									aria-label="Logout"
									class="rounded-lg"
									size="icon"
									variant="ghost"
									@click="logout"
								>
									<LucideIcon name="LogOut" :stroke-width="2" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right" :side-offset="5"> Logout</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<div class="flex justify-center">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger as-child>
								<NuxtLinkLocale :href="{ path: '/imprint' }">
									<Button aria-label="Imprint" class="rounded-lg" size="icon" variant="ghost">
										<LucideIcon name="Scale" :stroke-width="2" />
									</Button>
								</NuxtLinkLocale>
							</TooltipTrigger>
							<TooltipContent side="right" :side-offset="5"> Imprint</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</nav>
		</SidebarContent>
		<SidebarFooter> </SidebarFooter>
		<SidebarRail />
	</Sidebar>
</template>
