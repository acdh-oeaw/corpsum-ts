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
	attributes: Array<KWICAttribute>;
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

		// const selectedAttributeKeys: Ref<Array<String>> = ref([])
		// const selectedStructureKeys: Ref<Array<String>> = ref([])

		const selectedCorpusKWICViewInfo: Ref<SelectedCorpusKWICViewInfo> = ref(emptySelectedCorpusKWICViewInfo);

		const existingCorpusKWICSecetion = computed(() => {
			if (!corpInfoResponse.value || !selectedCorpusKWICViewInfo.value) return emptySelectedCorpusKWICViewInfo;
			return {
				attributes: selectedCorpusKWICViewInfo.value.attributes.filter(a => corpInfoResponse.value.attributes.find(ca => ca.name === a.name)),
				structures: selectedCorpusKWICViewInfo.value.structures.filter(a => corpInfoResponse.value.structures.find(ca => ca.name === a.name)),
			}
		})

		const KWICqueryString = computed(() => {
			const attributePart = existingCorpusKWICSecetion.value.attributes.map(attr => attr.name).join(',');
			const structurePart = existingCorpusKWICSecetion.value.structures.map(struct => struct.name).join(',');
			return `setattrs=${attributePart};setstructs=${structurePart}`;
		})

		const KWICqueryAttrs = computed(() => (
			{
				attrs: existingCorpusKWICSecetion.value.attributes.map(attr => attr.name).join(','),
				structs: existingCorpusKWICSecetion.value.structures.map(struct => struct.name).join(','),
			}
		));

		return {
			selectedCorpusKWICViewInfo,
			existingCorpusKWICSecetion,
			KWICqueryString,
			KWICqueryAttrs,
		};
	},
	{ persist: { storage: persistedState.localStorage } },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useKWICSettings, import.meta.hot));
}
