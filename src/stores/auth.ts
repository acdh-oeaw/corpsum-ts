import { defineStore } from "pinia";

export const useAuth = defineStore(
	"auth",
	() => {
		const username = ref("");
		const basicAuthToken = ref("");

		function login(username: string, password: string) {
			// todo actual login implementation
			if (username) {
				this.username = username;
				this.basicAuthToken = btoa(`${username}:${password}`);
				return true;
			}
			return false;
		}

		function logout() {
			this.username = "";
			this.basicAuthToken = "";
		}

		return { username, basicAuthToken, login, logout };
	},
	{ persist: true },
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot));
}
