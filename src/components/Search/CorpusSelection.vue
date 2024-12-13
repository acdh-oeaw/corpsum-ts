<script lang="ts" setup>
import {useQuery} from "@tanstack/vue-query";
import {Check, ChevronsUpDown, Server, SquareLibrary, LucideListFilter} from 'lucide-vue-next'
import {storeToRefs} from "pinia";
import {ref} from 'vue'

import {Button} from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import {useNoskeClient} from "@/composables/use-noske-client.ts";
import {cn} from '@/utils/styles.ts'
import {useQueriesStore} from "@/stores/queries.ts";


const queriesStore = useQueriesStore();
const {selectedNoske, selectedCorpus, selectedSubCorpus} = storeToRefs(queriesStore);
const api = useNoskeClient(selectedNoske.value!);
const corpsumAPI = useCorpsumClient();

const corpFetchingIsEnabled = computed(() => selectedNoske.value !== null);
const subCorpFetchingIsEnabled = computed(() => selectedCorpus.value !== null);


const {data: noskeInstances} = useQuery({
	placeholderData: [],
	queryKey: ["get-noskeinstances"] as const,
	async queryFn() {
		const response = await corpsumAPI.GET("/api/noskeinstances",);
		return response.data;
	},
});

const {data: corpora} = useQuery({
	enabled: corpFetchingIsEnabled.value,
	placeholderData: {data: []},
	queryKey: ["get-corpora", selectedNoske] as const,
	async queryFn() {
		const response = await api.GET("/ca/api/corpora",);
		return response.data;
	},
});

const {data: subCorpora} = useQuery({
	enabled: subCorpFetchingIsEnabled.value,
	queryKey: ["get-corp-info", selectedCorpus] as const,
	queryFn: async () => {
		const response = await api.GET("/search/corp_info", {
			params: {
				query: {
					corpname: selectedCorpus.value ? selectedCorpus.value : "",
					subcorpora: 1,
				}
			}
		});
		return response.data;
	},
});


const noskeSelectOpen = ref(false)
const corpusSelectOpen = ref(false)
const subCorpusSelectOpen = ref(false)

const c = useTranslations("Corpsum");
const t = useTranslations("CorpusSelection");
</script>

<template>
	<div class="grid grid-cols-3 max-md:grid-cols-1 gap-4">
	<Card>
		<CardHeader>
			<CardTitle>{{ $t("Corpus") }}</CardTitle>
			<CardDescription>
				{{ $t("SelectCorpusAndSubCorpus") }}
			</CardDescription>
		</CardHeader>
		<CardContent class="relative flex items-end p-6 pt-0">
			<div class="grid gap-4 pr-4">
				<div class="grid gap-1">
					<Label>
						<div
							class="flex items-start space-x-4 p-1">
							<Server class="mt-px size-5"/>
							<div class="mt-1">
								<p class="text-sm font-medium leading-none">
									{{ c("Noske") }}:
								</p>
							</div>
						</div>
					</Label>
					<Popover v-model:open="noskeSelectOpen">
						<PopoverTrigger as-child>
							<Button
								:aria-expanded="noskeSelectOpen"
								class="w-[200px] justify-between"
								role="combobox"
								variant="outline"
							>
								{{ selectedNoske ?? t("SelectCorpus") }}

								<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50"/>
							</Button>
						</PopoverTrigger>
						<PopoverContent class="w-[200px] p-0">
							<Command v-model="selectedNoske">
								<CommandInput :placeholder="t('SearchNoske')"/>
								<CommandEmpty>{{ t("NoEngineFound") }}</CommandEmpty>
								<CommandList>
									<CommandGroup>
										<CommandItem
											v-for="noske in noskeInstances"
											:key="noske?._id"
											:value="noske?.name ? noske.name : ''"
											@select="noskeSelectOpen = false; selectedCorpus = null; selectedSubCorpus = null;"
										>

											<Check
												:class="cn(
                  'mr-2 size-4',
                  selectedNoske === noske.name ? 'opacity-100' : 'opacity-0',
                )"
											/>
											{{ noske?.name }}
										</CommandItem>
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
				<div class="grid gap-1">
					<Label>
						<div
							class="flex items-start space-x-4 p-1">
							<SquareLibrary class="mt-px size-5"/>
							<div class="mt-1">
								<p class="text-sm font-medium leading-none">
									{{ c("Corpus") }}:
								</p>
							</div>
						</div>
					</Label>
					<Popover v-model:open="corpusSelectOpen">
						<PopoverTrigger as-child>
							<Button
								:aria-expanded="corpusSelectOpen"
								class="w-[200px] justify-between"
								role="combobox"
								variant="outline"
							>
								{{ selectedCorpus ?? t("SelectCorpus") }}

								<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50"/>
							</Button>
						</PopoverTrigger>
						<PopoverContent class="w-[200px] p-0">
							<Command v-model="selectedCorpus">
								<CommandInput :placeholder="t('SearchCorpus')"/>
								<CommandEmpty>{{ t("NoCorpusFound") }}</CommandEmpty>
								<CommandList>
									<CommandGroup>
										<CommandItem
											v-for="corpus in corpora?.data"
											:key="corpus?.id"
											:value="corpus?.name ? corpus.name : ''"
											@select="corpusSelectOpen = false; selectedSubCorpus = null;"
										>

											<Check
												:class="cn(
                  'mr-2 size-4',
                  selectedCorpus === corpus.name ? 'opacity-100' : 'opacity-0',
                )"
											/>
											{{ corpus?.name }}
										</CommandItem>
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
				<div class="grid gap-1">
					<Label>
						<div
							class="flex items-start space-x-4 p-1">
							<LucideListFilter class="mt-px size-5"/>
							<div class="mt-1">
								<p class="text-sm font-medium leading-none">
									{{ c("SubCorpus") }}:
								</p>
							</div>
						</div>
					</Label>
					<Popover v-model:open="subCorpusSelectOpen">
						<PopoverTrigger as-child>
							<Button
								:aria-expanded="subCorpusSelectOpen"
								class="w-[200px] justify-between"
								role="combobox"
								variant="outline"
							>
								{{ selectedSubCorpus ?? t("SelectSubCorpus") }}

								<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50"/>
							</Button>
						</PopoverTrigger>
						<PopoverContent class="w-[200px] p-0">
							<Command v-model="selectedSubCorpus">
								<CommandInput placeholder="Search framework..."/>
								<CommandEmpty>No framework found.</CommandEmpty>
								<CommandList>
									<CommandGroup>
										<CommandItem
											v-for="subCorpus in subCorpora?.subcorpora"
											:key="subCorpus.name"
											:value="subCorpus?.name ? subCorpus.name : ''"
											@select="subCorpusSelectOpen = false"
										>
											<Check
												:class="cn(
                  'mr-2 size-4',
                  selectedSubCorpus === subCorpus.name ? 'opacity-100' : 'opacity-0',
                )"
											/>
											{{ subCorpus?.name }}
										</CommandItem>
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
			</div>
		</CardContent>
	</Card>
	<Card class="col-span-2">
		<CardHeader>
			<CardTitle>
				{{ selectedNoske ? selectedNoske : "" }}
				{{ selectedNoske ? "/" : "" }}
				{{ selectedCorpus ? selectedCorpus : "" }}
				{{ selectedSubCorpus ? "/" : "" }}
				{{ selectedSubCorpus ? selectedSubCorpus : "" }}
			</CardTitle>
		</CardHeader>
		<CardContent class="grid gap-1">
			<div
				class="flex items-start space-x-4 rounded-md hover:bg-accent p-2 text-accent-foreground transition-all">
				<Server class="mt-px size-5"/>
				<div class="space-y-1">
					<p class="text-sm font-medium leading-none">
						{{ selectedNoske ? selectedNoske : "n/a" }}
					</p>
				</div>
			</div>
			<div
				class=" flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
				<SquareLibrary class="mt-px size-5"/>
				<div class="space-y-1">
					<p class="text-sm font-medium leading-none">
						{{ selectedCorpus ? selectedCorpus : "" }}
						{{ selectedSubCorpus ? "/" : "" }}
						{{ selectedSubCorpus ? selectedSubCorpus : "" }}
					</p>
				</div>
			</div>
		</CardContent>
	</Card>
	</div>
</template>
