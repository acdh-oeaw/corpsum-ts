import { defineStore } from "pinia";
import { watch } from "vue";

import { useCorporaStore } from "./corpora";

export const useAuth = defineStore(
	"auth",
	() => {
		const username = ref("");
		const basicAuthToken = ref("");

		watch(username, async () => {
			if (username.value) {
				await navigateTo("/");
			} else await navigateTo("/login");
		});
		async function login(_username: string, password: string) {
			if (_username) {
				basicAuthToken.value = btoa(`${_username}:${password}`);
				const copora = useCorporaStore();
				const corpora = await copora.fetchCorpora();
				if (!corpora) {
					basicAuthToken.value = "";
					return false;
				}
				username.value = _username;
				return true;
			}
			return false;
		}

		function logout() {
			username.value = "";
			basicAuthToken.value = "";
		}

		return { username, basicAuthToken, login, logout };
	},
	{ persist: true },
	//{ persist: { storage: persistedState.localStorage }, },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot));
}
