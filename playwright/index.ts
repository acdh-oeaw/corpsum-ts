import "@fontsource-variable/inter/standard.css";
import "@fontsource-variable/inter/standard-italic.css";
import "@/styles/index.css";

import { beforeMount } from "@playwright/experimental-ct-vue/hooks";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { computed, ref, watch, watchEffect } from "vue";
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
import { useNoskeFreqMlQueries } from "@/composables/use-noske-freqml-queries";
import { useTranslations } from "@/composables/use-translations";
import de from "~/i18n/messages/de.json";
import en from "~/i18n/messages/en.json";

interface HooksConfig {
	locale?: "de" | "en";
}

// Playwright CT runs plain Vite rather than Nuxt, so expose the auto-imports
// used by components under test.
Object.assign(globalThis, {
	computed,
	ref,
	useLocale,
	useI18n,
	useNoskeFreqMlQueries,
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
	app.component("Chart", { template: "<div data-testid='chart' />" });
	app.component("QueryDisplay", { template: "<div data-testid='query-display' />" });
	app.component("DataDisplaySourceTable", { template: "<div data-testid='source-table' />" });
	app.provide("disablePortal", true);
});
