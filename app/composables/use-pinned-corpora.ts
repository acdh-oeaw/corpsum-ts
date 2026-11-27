interface PinnedCorpus {
	instanceId: string;
	corpus: string;
}

export function usePinnedCorpora() {
	const auth = useAuth();
	const key = computed(() => `pinned-corpora:${auth.username}`);
	const { data, refresh } = useFetch<Array<PinnedCorpus>>("/api/settings/pinned-corpora", {
		key,
		default: () => [],
		watch: [key],
	});
	const pending = useState<Record<string, boolean>>("pinned-corpora:pending", () => ({}));
	function isPinned(instanceId: string, corpus: string) {
		return data.value.some((pin) => pin.instanceId === instanceId && pin.corpus === corpus);
	}
	async function toggle(instanceId: string, corpus: string) {
		const id = `${instanceId}:${corpus}`;
		if (pending.value[id]) return;
		pending.value = { ...pending.value, [id]: true };
		try {
			await $fetch("/api/settings/pinned-corpora", {
				method: "PUT",
				body: { instanceId, corpus, pinned: !isPinned(instanceId, corpus) },
			});
			await refresh();
		} finally {
			pending.value = { ...pending.value, [id]: false };
		}
	}
	return { pins: data, isPinned, toggle, pending };
}
