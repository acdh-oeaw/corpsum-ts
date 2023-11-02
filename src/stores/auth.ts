import { defineStore } from "pinia";

import { useCorporaStore } from "./corpora";

export const useAuth = defineStore(
	"auth",
	() => {
		const username = ref("");
		const basicAuthToken = ref("");

		async function login(_username: string, password: string) {
			// todo actual login implementation
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
