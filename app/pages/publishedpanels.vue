<script setup lang="ts">
import type { PublishedVisualizationResponse } from "~/server/utils/published-visualization-response";

const env = useRuntimeConfig();
const t = useTranslations();
const selected = ref<PublishedVisualizationResponse | null>(null);
const isHiding = ref(false);
const hideFailed = ref(false);

const { data: published, refresh } = await useFetch<Array<PublishedVisualizationResponse>>(
	"/api/published-visualizations",
);

function publicLink(uid: string) {
	return new URL(`/v/${uid}`, env.public.appBaseUrl).toString();
}

function escapeAttribute(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function embedSnippet(item: PublishedVisualizationResponse) {
	const src = new URL(`/v/${item.uid}/embed`, env.public.appBaseUrl).toString();
	return `<iframe src="${src}" width="100%" height="720" loading="lazy" style="border:0;" title="${escapeAttribute(item.title)}"></iframe>`;
}

async function hide() {
	if (!selected.value || isHiding.value) return;
	isHiding.value = true;
	hideFailed.value = false;
	try {
		await $fetch(`/api/published-visualization/${selected.value.uid}`, {
			method: "PATCH",
			body: { isPublic: false },
		});
		await refresh();
		selected.value = null;
	} catch {
		hideFailed.value = true;
	} finally {
		isHiding.value = false;
	}
}
</script>

<template>
	<MainContent class="w-full min-w-0">
		<div class="my-10 flex items-center gap-3">
			<div class="flex size-16 items-center justify-center rounded-full border bg-muted/40">
				<LucideIcon class="size-8 text-foreground" name="PanelsTopLeft" :stroke-width="2" />
			</div>
			<PageTitle>{{ t("PublishedPanelsPage.title") }}</PageTitle>
			<DocumentationLink slug="veroeffentlichte-panels" />
		</div>
		<AppDescription name="veroeffentlichte-panels" class="mb-4" />

		<div class="overflow-x-auto rounded-md border">
			<Table class="w-full text-sm">
				<TableHeader>
					<TableRow>
						<TableHead>{{ t("PublishedPanelsPage.tableTitle") }}</TableHead>
						<TableHead>{{ t("PublishedPanelsPage.state") }}</TableHead>
						<TableHead>{{ t("PublishedPanelsPage.published") }}</TableHead>
						<TableHead>{{ t("PublishedPanelsPage.link") }}</TableHead>
						<TableHead>{{ t("PublishedPanelsPage.embed") }}</TableHead>
						<TableHead class="text-right">{{ t("PublishedPanelsPage.actions") }}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow v-for="item in published ?? []" :key="item.uid">
						<TableCell class="font-medium">{{ item.title }}</TableCell>
						<TableCell>{{
							item.isPublic ? t("PublishedPanelsPage.public") : t("PublishedPanelsPage.hidden")
						}}</TableCell>
						<TableCell>{{ new Date(item.publishedAt).toLocaleDateString() }}</TableCell>
						<TableCell>
							<a class="break-all underline" :href="publicLink(item.uid)">{{
								publicLink(item.uid)
							}}</a>
						</TableCell>
						<TableCell>
							<code
								class="block max-w-lg whitespace-pre-wrap break-all rounded bg-muted p-2 text-xs"
								>{{ embedSnippet(item) }}</code
							>
						</TableCell>
						<TableCell class="text-right">
							<Button
								:disabled="!item.isPublic"
								size="sm"
								type="button"
								variant="outline"
								@click="
									hideFailed = false;
									selected = item;
								"
							>
								{{ t("PublishedPanelsPage.hide") }}
							</Button>
						</TableCell>
					</TableRow>
					<TableRow v-if="(published ?? []).length === 0">
						<TableCell class="text-muted-foreground" colspan="6">
							{{ t("PublishedPanelsPage.empty") }}
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</div>
		<AlertDialog
			:open="selected !== null"
			@update:open="
				(open) => {
					if (!open && !isHiding) selected = null;
				}
			"
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{{ t("PublishedPanelsPage.hideTitle") }}</AlertDialogTitle>
					<AlertDialogDescription>{{
						t("PublishedPanelsPage.hideDescription", { title: selected?.title ?? "" })
					}}</AlertDialogDescription>
				</AlertDialogHeader>
				<p v-if="hideFailed" role="alert" class="text-sm text-destructive">
					{{ t("PublishedPanelsPage.hideError") }}
				</p>
				<AlertDialogFooter>
					<AlertDialogCancel :disabled="isHiding">{{ t("Actions.cancel") }}</AlertDialogCancel>
					<Button :disabled="isHiding" @click="hide">{{ t("PublishedPanelsPage.hide") }}</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</MainContent>
</template>
