import { defineStore } from "pinia";

export const useAuth = defineStore(
	"auth",
	() => {
		const username = ref("");
		const basicAuthToken = ref("");

		function login(_username: string, password: string) {
			// todo actual login implementation
			if (_username) {
				username.value = _username;


				basicAuthToken.value = btoa(`${username.value}:${password}`);
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
