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
</script>

<template>
	<aside class="fixed left-0 z-20 flex h-full flex-col border-r">
		<NuxtLinkLocale :href="{ path: '/' }">
			<div class="border-b p-2">
				<Button aria-label="Home" size="icon" variant="ghost"> CS </Button>
			</div>
		</NuxtLinkLocale>
		<nav class="grid gap-1 p-2">
			<TooltipProvider v-for="(item, index) in NavItems" :key="index">
				<Tooltip>
					<TooltipTrigger as-child>
						<NuxtLinkLocale :href="{ path: item.href }">
							<Button :aria-label="item.tooltip" class="rounded-md" size="icon" variant="ghost">
								<LucideIcon :name="item.icon" :stroke-width="2" />
							</Button>
						</NuxtLinkLocale>
					</TooltipTrigger>
					<TooltipContent side="right" :side-offset="5">
						{{ item.tooltip }}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</nav>
		<nav class="mt-auto grid gap-1 p-2">
			<LocaleSwitcher></LocaleSwitcher>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger as-child>
						<NuxtLinkLocale :href="{ path: '/imprint' }">
							<Button aria-label="Imprint" class="rounded-lg" size="icon" variant="ghost">
								<LucideIcon name="Scale" :stroke-width="2" />
							</Button>
						</NuxtLinkLocale>
					</TooltipTrigger>
					<TooltipContent side="right" :side-offset="5"> Imprint </TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</nav>
	</aside>
</template>
