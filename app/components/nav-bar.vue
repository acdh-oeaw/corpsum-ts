<script setup lang="ts">
const NavItems = [
	{
		icon: "Book",
		tooltip: "Corpora",
	},
	{
		icon: "Terminal",
		tooltip: "Queries",
	},
	{
		icon: "ChartLine",
		tooltip: "Visualizations",
	},
];
</script>

<template>
	<aside class="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
		<div class="border-b p-2">
			<Button aria-label="Home" size="icon" variant="outline"> CS </Button>
		</div>
		<nav class="grid gap-1 p-2">
			<TooltipProvider v-for="(item, index) in NavItems" :key="index">
				<Tooltip>
					<TooltipTrigger as-child>
						<Button
							:aria-label="item.tooltip"
							class="rounded-lg bg-muted"
							size="icon"
							variant="ghost"
						>
							<LucideIcon :name="item.icon" stroke-width="2" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="right" :side-offset="5">
						{{ item.tooltip }}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</nav>
	</aside>
</template>
