import { defineStore } from "pinia";

import { useApiClient } from "@/composables/use-api-client.ts";

export const useAuth = defineStore(
	"newAuth",
	() => {
		const authtoken = ref("");
		const username = ref("");
		const api = useApiClient();

		async function login(_username: string, _password: string) {
			if (_username && _password) {
				api.setSecurityData({
					token: "Basic " + btoa(_username + ":" + _password),
				});
				const corpora = await api.ca.getCorpora();
				if (!Array.isArray(corpora.data.data)) {
					authtoken.value = "";
					return false;
				}
				username.value = _username;
				authtoken.value = "Basic " + btoa(_username + ":" + _password);
				return true;
			}
			return false;
		}

		function logout() {
			username.value = "";
			authtoken.value = "";
			api.setSecurityData({
				token: "",
			});
		}

		function isLoggedIn(): boolean {
			if (authtoken.value !== "" && username.value !== "") return true;
			return false;
		}

		return { login, logout, isLoggedIn, authtoken, username };
	},
	{
		persist: {
			pick: ["authtoken", "username"],
		},
	},
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot));
}
