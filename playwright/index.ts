import "@fontsource-variable/inter/standard.css";
import "@fontsource-variable/inter/standard-italic.css";
import "@/styles/index.css";

import { beforeMount } from "@playwright/experimental-ct-vue/hooks";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { computed, defineComponent, h, ref, watch, watchEffect } from "vue";
import type { PropType } from "vue";
import { createI18n, useI18n } from "vue-i18n";

import Button from "@/components/ui/button/Button.vue";
import Card from "@/components/ui/card/Card.vue";
import CardContent from "@/components/ui/card/CardContent.vue";
import CardDescription from "@/components/ui/card/CardDescription.vue";
import CardFooter from "@/components/ui/card/CardFooter.vue";
import CardHeader from "@/components/ui/card/CardHeader.vue";
import CardTitle from "@/components/ui/card/CardTitle.vue";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import Collapsible from "@/components/ui/collapsible/Collapsible.vue";
import CollapsibleContent from "@/components/ui/collapsible/CollapsibleContent.vue";
import Input from "@/components/ui/input/Input.vue";
import Label from "@/components/ui/label/Label.vue";
import Popover from "@/components/ui/popover/Popover.vue";
import PopoverContent from "@/components/ui/popover/PopoverContent.vue";
import PopoverTrigger from "@/components/ui/popover/PopoverTrigger.vue";
import Select from "@/components/ui/select/Select.vue";
import SelectContent from "@/components/ui/select/SelectContent.vue";
import SelectItem from "@/components/ui/select/SelectItem.vue";
import SelectTrigger from "@/components/ui/select/SelectTrigger.vue";
import SelectValue from "@/components/ui/select/SelectValue.vue";
import Separator from "@/components/ui/separator/Separator.vue";
import Toolbar from "@/components/ui/toolbar/Toolbar.vue";
import ToolbarButton from "@/components/ui/toolbar/ToolbarButton.vue";
import ToolbarSeparator from "@/components/ui/toolbar/ToolbarSeparator.vue";
import ToolbarToggleGroup from "@/components/ui/toolbar/ToolbarToggleGroup.vue";
import ToolbarToggleItem from "@/components/ui/toolbar/ToolbarToggleItem.vue";
import Tooltip from "@/components/ui/tooltip/Tooltip.vue";
import TooltipContent from "@/components/ui/tooltip/TooltipContent.vue";
import TooltipProvider from "@/components/ui/tooltip/TooltipProvider.vue";
import TooltipTrigger from "@/components/ui/tooltip/TooltipTrigger.vue";
import { useLocale } from "@/composables/use-locale";
import {
	createNoskeCacheHeaders,
	recordNoskeCacheMetadataFromResponse,
} from "@/composables/use-noske-cache-metadata";
import { useNoskeFreqMlQueries } from "@/composables/use-noske-freqml-queries";
import { useTranslations } from "@/composables/use-translations";
import { categoryColors } from "@/utils/colors";
import de from "~/i18n/messages/de.json";
import en from "~/i18n/messages/en.json";

interface HooksConfig {
	locale?: "de" | "en";
}

const componentTestState = new Map<string, ReturnType<typeof ref>>();

function useComponentTestState<T>(key: string, init: () => T) {
	if (!componentTestState.has(key)) componentTestState.set(key, ref(init()));
	return componentTestState.get(key)!;
}

// Playwright CT runs plain Vite rather than Nuxt, so expose the auto-imports
// used by components under test.
Object.assign(globalThis, {
	computed,
	createNoskeCacheHeaders,
	categoryColors,
	ref,
	recordNoskeCacheMetadataFromResponse,
	useLocale,
	useI18n,
	useNoskeClient: () => ({ client: computed(() => null) }),
	useNoskeFreqMlQueries,
	useState: useComponentTestState,
	useTranslations,
	watch,
	watchEffect,
});

beforeMount<HooksConfig>(async ({ app, hooksConfig }) => {
	const locale = hooksConfig?.locale ?? "en";
	app.use(
		createI18n({
			legacy: false,
			locale,
			messages: { de, en },
		}),
	);
	app.use(VueQueryPlugin, { queryClient: new QueryClient() });
	for (const [name, component] of Object.entries({
		Button,
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle,
		Checkbox,
		Collapsible,
		CollapsibleContent,
		Input,
		Label,
		Popover,
		PopoverContent,
		PopoverTrigger,
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue,
		Separator,
		Toolbar,
		ToolbarButton,
		ToolbarSeparator,
		ToolbarToggleGroup,
		ToolbarToggleItem,
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger,
	})) {
		app.component(name, component);
	}
	app.component(
		"Chart",
		defineComponent({
			props: {
				series: { type: Array, default: () => [] },
			},
			setup(props) {
				return () =>
					h("div", {
						"data-testid": "chart",
						"data-series": JSON.stringify(props.series),
					});
			},
		}),
	);
	app.component(
		"ClientOnly",
		defineComponent({
			setup(_, { slots }) {
				return () => slots.default?.();
			},
		}),
	);
	app.component(
		"CombinedMapChart",
		defineComponent({
			props: {
				queries: { type: Array as PropType<Array<CorpusQuery>>, required: true },
				resdata: { type: Array as PropType<Array<RegionalFrequency>>, required: true },
			},
			setup(props) {
				return () =>
					h("div", {
						"data-testid": "combined-map-chart",
						"data-query-colors": JSON.stringify(props.queries.map((query) => query.color)),
						"data-regional-frequencies": JSON.stringify(props.resdata),
					});
			},
		}),
	);
	app.component(
		"QueryDisplay",
		defineComponent({
			props: {
				loading: { type: Boolean, default: false },
				query: { type: Object as PropType<CorpusQuery>, required: true },
				queryKey: { type: Array as PropType<ReadonlyArray<unknown>>, default: undefined },
			},
			setup(props) {
				return () =>
					h(
						"div",
						{
							"data-testid": "query-display",
							"data-loading": String(props.loading),
							"data-query": JSON.stringify(props.query),
							"data-query-key": JSON.stringify(props.queryKey),
						},
						"Query display",
					);
			},
		}),
	);
	app.component(
		"DataDisplaySourceTable",
		defineComponent({
			props: {
				data: { type: Array, required: true },
				loading: { type: Array as PropType<Array<boolean>>, required: true },
				queries: { type: Array as PropType<Array<CorpusQuery>>, required: true },
			},
			setup(props) {
				return () =>
					h("div", {
						"data-testid": "source-table",
						"data-loading": JSON.stringify(props.loading),
						"data-queries": JSON.stringify(props.queries),
						"data-source-data": JSON.stringify(props.data),
					});
			},
		}),
	);
	app.component(
		"MapChart",
		defineComponent({
			props: {
				query: { type: Object as PropType<CorpusQuery>, required: true },
				resdata: { type: Array as PropType<Array<RegionalFreqData>>, required: true },
			},
			setup(props) {
				return () =>
					h("div", {
						"data-testid": "map-chart",
						"data-query": JSON.stringify(props.query),
						"data-regional-frequency": JSON.stringify(props.resdata),
					});
			},
		}),
	);
	app.component(
		"MediaStackedBarChart",
		defineComponent({
			props: {
				queries: { type: Array as PropType<Array<CorpusQuery>>, required: true },
				sourceDistributions: {
					type: Array as PropType<Array<Array<IsourceDistribution>>>,
					required: true,
				},
			},
			setup(props) {
				return () =>
					h("div", {
						"data-testid": "media-stacked-bar-chart",
						"data-query-colors": JSON.stringify(props.queries.map((query) => query.color)),
						"data-source-distributions": JSON.stringify(props.sourceDistributions),
					});
			},
		}),
	);
	app.provide("disablePortal", true);
});
