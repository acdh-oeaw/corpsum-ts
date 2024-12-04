<script lang="ts" setup>
import {useQuery} from "@tanstack/vue-query";
import {BookCopy,Check, ChevronsUpDown } from 'lucide-vue-next'
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
import {cn} from '@/utils/styles.ts'

const api = useApiClient();

const corporaStore = useCorporaStore();
const {selectedCorpus, selectedSubCorpus} = storeToRefs(corporaStore);

const subCorpFetchingIsEnabled = computed(() => selectedCorpus.value !== null);

const {data: corpora} = useQuery({
	placeholderData: {data: []},
	queryKey: ["get-corpora"] as const,
	async queryFn() {
		const response = await api.ca.getCorpora();
		return response.data;
	},
});

const {data: subCorpora} = useQuery({
	enabled: subCorpFetchingIsEnabled.value,
	queryKey: ["get-corp-info", selectedCorpus] as const,
	queryFn: async () => {
		const response = await api.search.getCorpInfo({
			corpname: selectedCorpus.value ? selectedCorpus.value : "",
			subcorpora: 1,
		});
		return response.data;
	},
});



const corpusSelectOpen = ref(false)
const subCorpusSelectOpen = ref(false)

const c = useTranslations("Corpsum");
const t = useTranslations("CorpusSelection");
</script>

<template>
	<Card class="h-56 w-full">
		<CardHeader>
			<CardTitle>{{ $t("Corpus") }}</CardTitle>
			<CardDescription>
				{{ $t("SelectCorpusAndSubCorpus") }}
			</CardDescription>
		</CardHeader>
		<CardContent class="flex items-end p-6 pt-0 relative -top-16">
			<div class=" grid gap-4 pr-4">
				<div class="grid gap-1">
					<Label>
						{{ c("Corpus") }}:
					</Label>
					<Popover v-model:open="corpusSelectOpen">
						<PopoverTrigger as-child>
							<Button
								variant="outline"
								role="combobox"
								:aria-expanded="corpusSelectOpen"
								class="w-[200px] justify-between"
							>
								{{ selectedCorpus ?? t("SelectCorpus") }}

								<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50"/>
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
                  'mr-2 h-4 w-4',
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
						{{ c("SubCorpus") }}:
					</Label>
					<Popover v-model:open="subCorpusSelectOpen">
						<PopoverTrigger as-child>
							<Button
								variant="outline"
								role="combobox"
								:aria-expanded="subCorpusSelectOpen"
								class="w-[200px] justify-between"
							>
								{{ selectedSubCorpus ?? t("SelectSubCorpus") }}

								<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50"/>
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
                  'mr-2 h-4 w-4',
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
			<div class="grow">
				<Card class="w-auto">
					<CardContent class="grid gap-1">
						<div
							class="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
							<div class="space-y-1">
								<p class="text-sm font-bold">
									{{ selectedCorpus ? selectedCorpus : "" }} {{ selectedSubCorpus ? "/" : "" }}  {{ selectedSubCorpus ? selectedSubCorpus : "" }}
								</p>
							</div>
						</div>
						<div
							class="-mx-2 flex items-start space-x-4 rounded-md bg-accent p-2 text-accent-foreground transition-all">
							<PersonIcon class="mt-px h-5 w-5"/>
							<div class="space-y-1">
								<p class="text-sm font-medium leading-none">
									{{}}
								</p>
							</div>
						</div>
						<div
							class="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
							<EyeNoneIcon class="mt-px h-5 w-5"/>
							<div class="space-y-1">
								<p class="text-sm font-medium leading-none">
									Ignoring
								</p>
							</div>
						</div>
						<div
							class="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
							<EyeNoneIcon class="mt-px h-5 w-5"/>
							<div class="space-y-1">
								<p class="text-sm font-medium leading-none">
									Ignoring
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</CardContent>
	</Card>
</template>
