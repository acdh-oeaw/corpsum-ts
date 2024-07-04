import { acceptHMRUpdate, defineStore } from "pinia";
import { computed, type Ref, ref, watch } from "vue";


interface KWICAttribute {
	name: string;
	id_range?: number;
	label: string;
	dynamic: string;
	fromattr: string;
	size?: string;
}

interface KWICStructure {
	name: string;
	label: string;
	attributes: KWICAttribute[];
	size: string;
}
interface SelectedCorpusKWICViewInfo {
	attributes: Array<KWICAttribute>;
	structures: Array<KWICStructure>;
}


const emptySelectedCorpusKWICViewInfo: SelectedCorpusKWICViewInfo = {
	attributes: [],
	structures: [],
}

export const useKWICSettings = defineStore(
	"KWICSettings",
	() => {
		const corporaStore = useCorporaStore();
		const { corpInfoResponse } = storeToRefs(corporaStore)

		const selectedAttributeKeys: Ref<Array<String>> = ref([])
		const selectedStructureKeys: Ref<Array<String>> = ref([])


		const existingCorpusKWICSecetion = computed(() => {
			if (!corpInfoResponse.value) return emptySelectedCorpusKWICViewInfo;
			return {
				attributes: corpInfoResponse.value.attributes.filter(a => selectedAttributeKeys.value.find(ca => ca === a.name)),
				structures: corpInfoResponse.value.structures.filter(a => selectedStructureKeys.value.find(ca => ca === a.name)),
			}
		})

		return {
			selectedAttributeKeys,
			selectedStructureKeys,

			existingCorpusKWICSecetion,
		};
	},
	// { persist: { storage: persistedState.localStorage } },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useKWICSettings, import.meta.hot));
}
