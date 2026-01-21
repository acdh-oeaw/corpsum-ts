<script setup lang="ts">
import { Check, ChevronsUpDown } from "lucide-vue-next";
import {
	ComboboxAnchor,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxItemIndicator,
	ComboboxRoot,
	ComboboxTrigger,
	ComboboxViewport,
} from "reka-ui";

import type { PopulatedNoskeDocument } from "~/server/api/noskeinstances.get.ts";

const t = useTranslations();

interface Props {
	data: Array<PopulatedNoskeDocument>;
	modelValue?: string | null;
	placeholder?: string;
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	disabled: false,
});

const emit = defineEmits<{
	(event: "update:modelValue", value: string | null): void;
}>();

const open = ref(false);
const search = ref("");

const selectedValue = computed<string>({
	get: () => props.modelValue ?? "",
	set: (value) => emit("update:modelValue", value || null),
});

const selectedItem = computed(
	() => props.data.find((item) => item._id === selectedValue.value) ?? null,
);

const resolvedPlaceholder = computed(
	() => props.placeholder ?? t("NoskeInstanceComboBox.placeholder"),
);

const filteredItems = computed(() => {
	if (!search.value.trim()) return props.data;
	const query = search.value.toLowerCase();
	return props.data.filter((item) =>
		`${item.name} ${item.owner.username}`.toLowerCase().includes(query),
	);
});

const displayValue = () => "";

watch(open, (isOpen) => {
	if (isOpen) {
		void nextTick().then(() => {
			search.value = "";
		});
	}
});

watch(selectedValue, () => {
	search.value = "";
});
</script>

<template>
	<ComboboxRoot
		v-model="selectedValue"
		v-model:open="open"
		class="w-full min-w-0"
		:ignore-filter="true"
		:reset-search-term-on-select="true"
	>
		<ComboboxAnchor class="w-full min-w-0">
			<ComboboxTrigger as-child>
				<Button class="w-full justify-between" :disabled="props.disabled" variant="outline">
					<span v-if="selectedItem" class="truncate">
						<span class="font-medium">{{ selectedItem.name }}</span>
						<span class="text-muted-foreground"> — {{ selectedItem.base }}</span>
					</span>
					<span v-else class="truncate text-muted-foreground">{{ resolvedPlaceholder }}</span>
					<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			</ComboboxTrigger>
		</ComboboxAnchor>
		<ComboboxContent
			class="z-50 w-[--reka-popper-anchor-width] rounded-md border bg-popover p-0 shadow-md"
		>
			<div class="p-2">
				<ComboboxInput
					v-model="search"
					class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
					:display-value="displayValue"
					:placeholder="t('NoskeInstanceComboBox.searchPlaceholder')"
				/>
			</div>
			<ComboboxViewport class="max-h-60 overflow-auto">
				<ComboboxEmpty class="px-3 py-2 text-sm text-muted-foreground">
					{{ t("NoskeInstanceComboBox.empty") }}
				</ComboboxEmpty>
				<ComboboxItem
					v-for="item in filteredItems"
					:key="item._id"
					class="flex cursor-pointer items-center justify-between px-3 py-2 text-sm data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
					:text-value="`${item.name} ${item.owner.username}`"
					:value="item._id"
				>
					<span class="truncate">
						<span class="font-medium">{{ item.name }}</span>
						<span class="text-muted-foreground"> — {{ item.base }}</span>
					</span>
					<ComboboxItemIndicator class="ml-2">
						<Check class="size-4" />
					</ComboboxItemIndicator>
				</ComboboxItem>
			</ComboboxViewport>
		</ComboboxContent>
	</ComboboxRoot>
</template>
