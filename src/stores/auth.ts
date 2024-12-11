import { defineStore } from "pinia";

export const useAuth = defineStore(
	"newAuth",
	() => {
		const username = ref("");
		let expiry= 0;

		async function login(_username: string, _password: string) {
			if (_username && _password) {
				const res= await fetch("/api/auth/login", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						username: _username,
						password: _password,
					}),
				});
				if (res.ok) {
					const data: LoginResponse = await res.json() as LoginResponse;
					username.value = data.user;
					expiry = data.expires;
					return true;
				}
			}
			return false;
		}

		async function logout() {
			await fetch("/api/auth/logout", {
				method: "DELETE",
			});
			username.value = "";
		}

		async function refresh() {
			const res = await fetch("/api/auth/refresh");
			if(res.ok) {
		    const data: RefreshResponse = await res.json() as RefreshResponse;
				expiry = data.expires;
				return true;
			}
			return false;
		}

		function isLoggedIn(): boolean {
			if (username.value !== "") return true;
			return false;
		}

		return { login, logout, isLoggedIn, refresh, username, expiry };
	},
	{
		persist: {
			pick: ["username"],
		},
	},
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot));
}
