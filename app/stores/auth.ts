import { acceptHMRUpdate, defineStore } from "pinia";

import type { NormalizedSignupPayload } from "@/utils/auth-validation";

export const useAuth = defineStore(
	"newAuth",
	() => {
		const username = ref("");
		const expiry = ref(0);

		function setSession(data: { username: string; expires: number }) {
			username.value = data.username;
			expiry.value = data.expires;
		}

		function clear() {
			username.value = "";
			expiry.value = 0;
		}

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
					setSession({ username: data.user, expires: data.expires });
					return true;
				}
			}
			clear();
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
				setSession({ username: data.user, expires: data.expires });
				return { ok: true as const, errors: {} };
			}

			const data = (await res.json().catch(() => ({}))) as RegisterErrorResponse;
			return { ok: false as const, errors: data.errors ?? {} };
		}

		async function logout() {
			await fetch("/api/auth/logout", {
				method: "DELETE",
			});
			clear();
		}

		async function refresh() {
			const res = await fetch("/api/auth/refresh");
			if (res.ok) {
				const data: RefreshResponse = (await res.json()) as RefreshResponse;
				setSession(data);
				return true;
			}
			clear();
			return false;
		}

		function isLoggedIn(): boolean {
			return username.value !== "" && expiry.value > Date.now();
		}

		return { clear, login, register, logout, isLoggedIn, refresh, setSession, username, expiry };
	},
	{
		persist: {
			pick: ["username", "expiry"],
		},
	},
);

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useAuth, import.meta.hot));
}
