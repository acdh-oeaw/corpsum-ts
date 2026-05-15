import { acceptHMRUpdate, defineStore } from "pinia";

import type { NormalizedSignupPayload } from "@/utils/auth-validation";

export const useAuth = defineStore(
	"newAuth",
	() => {
		const username = ref("");
		const expiry = ref(0);

		async function login(_username: string, _password: string) {
			if (_username && _password) {
				const res = await fetch("/api/auth/login", {
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
					const data: LoginResponse = (await res.json()) as LoginResponse;
					username.value = data.user;
					expiry.value = data.expires;
					return true;
				}
			}
			return false;
		}

		async function register(payload: NormalizedSignupPayload) {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});
			if (res.ok) {
				const data: RegisterResponse = (await res.json()) as RegisterResponse;
				username.value = data.user;
				expiry.value = data.expires;
				return { ok: true as const, errors: {} };
			}

			const data = (await res.json().catch(() => ({}))) as RegisterErrorResponse;
			return { ok: false as const, errors: data.errors ?? {} };
		}

		async function logout() {
			await fetch("/api/auth/logout", {
				method: "DELETE",
			});
			username.value = "";
		}

		async function refresh() {
			const res = await fetch("/api/auth/refresh");
			if (res.ok) {
				const data: RefreshResponse = (await res.json()) as RefreshResponse;
				username.value = data.username;
				expiry.value = data.expires;
				return true;
			}
			return false;
		}

		function isLoggedIn(): boolean {
			return username.value !== "";
		}

		return { login, register, logout, isLoggedIn, refresh, username, expiry };
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
