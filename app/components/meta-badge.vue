<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		label: string;
		tone?: "green" | "orange" | "red" | "sky" | "slate" | "violet";
		value: number | string;
	}>(),
	{
		tone: "slate",
	},
);

const toneClasses = {
	green: {
		label: "bg-green-200 text-green-950",
		value: "bg-green-50/95 text-green-950",
	},
	orange: {
		label: "bg-orange-200 text-orange-950",
		value: "bg-orange-50/95 text-orange-950",
	},
	red: {
		label: "bg-red-200 text-red-950",
		value: "bg-red-50/95 text-red-950",
	},
	sky: {
		label: "bg-sky-200 text-sky-950",
		value: "bg-sky-50/95 text-sky-950",
	},
	slate: {
		label: "bg-slate-200 text-slate-950",
		value: "bg-slate-50/95 text-slate-950",
	},
	violet: {
		label: "bg-violet-200 text-violet-950",
		value: "bg-violet-50/95 text-violet-950",
	},
};

const classes = computed(() => toneClasses[props.tone]);
</script>

<template>
	<TooltipProvider :delay-duration="150">
		<Tooltip>
			<TooltipTrigger as-child>
				<div
					:aria-label="`${props.label}: ${props.value}`"
					class="inline-flex max-w-full overflow-hidden rounded-sm border border-primary/30 text-xs shadow-sm"
				>
					<span class="inline-flex items-center px-1.5 py-1" :class="classes.label">
						<slot name="icon" />
					</span>
					<span class="min-w-0 truncate px-2 py-1 font-semibold" :class="classes.value">
						{{ props.value }}
					</span>
				</div>
			</TooltipTrigger>
			<TooltipContent>{{ props.label }}</TooltipContent>
		</Tooltip>
	</TooltipProvider>
</template>
