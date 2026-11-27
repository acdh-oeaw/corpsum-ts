import { cva, type VariantProps } from "class-variance-authority";

export { default as Toggle } from "./Toggle.vue";

export const toggleVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:block-4 [&_svg]:inline-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-transparent",
				outline:
					"border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
			},
			size: {
				default: "block-9 px-2 min-inline-9",
				sm: "block-8 px-1.5 min-inline-8",
				lg: "block-10 px-2.5 min-inline-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type ToggleVariants = VariantProps<typeof toggleVariants>;
