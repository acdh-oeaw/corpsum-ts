import type { NormalizedSignupPayload, SignupFieldErrors } from "@/utils/auth-validation";

interface AuthUser {
	accounttype?: string;
	email?: string;
	username: string;
}

interface AuthSessionResponse {
	expires?: number;
	user?: string;
	username?: string;
}

interface LoginResponse extends AuthSessionResponse {
	loggedIn: boolean;
	user: string;
}

interface RegisterResponse extends AuthSessionResponse {
	registered: boolean;
	user: string;
}

interface RegisterErrorResponse {
	errors?: SignupFieldErrors;
}

type AuthFetch = typeof $fetch;

function getSessionUsername(data: AuthSessionResponse): string {
	return data.username ?? data.user ?? "";
}

export function useAuth() {
	const user = useState<AuthUser | null>("auth:user", () => null);
	const username = computed(() => user.value?.username ?? "");

	function setUser(data: AuthUser | AuthSessionResponse | null) {
		const nextUsername = data ? getSessionUsername(data) : "";
		user.value = nextUsername
			? {
					...(user.value ?? {}),
					...data,
					username: nextUsername,
				}
			: null;
	}

	async function login(_username: string, _password: string) {
		if (!_username || !_password) {
			setUser(null);
			return false;
		}

		const res = await fetch("/api/auth/login", {
			body: JSON.stringify({
				password: _password,
				username: _username,
			}),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});

		if (!res.ok) {
			setUser(null);
			return false;
		}

		const data = (await res.json()) as LoginResponse;
		setUser(data);
		return true;
	}

	async function register(payload: NormalizedSignupPayload) {
		const res = await fetch("/api/auth/register", {
			body: JSON.stringify(payload),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});

		if (res.ok) {
			const data = (await res.json()) as RegisterResponse;
			setUser(data);
			return { errors: {}, ok: true as const };
		}

		const data = (await res.json().catch(() => ({}))) as RegisterErrorResponse;
		return { errors: data.errors ?? {}, ok: false as const };
	}

	async function logout() {
		await fetch("/api/auth/logout", {
			method: "DELETE",
		});
		setUser(null);
	}

	async function refresh(fetcher: AuthFetch = $fetch) {
		try {
			const data = await fetcher<AuthSessionResponse>("/api/auth/refresh");
			setUser(data);
			return true;
		} catch {
			setUser(null);
			return false;
		}
	}

	function isLoggedIn(): boolean {
		return username.value.length > 0;
	}

	return reactive({ isLoggedIn, login, logout, refresh, register, user, username });
}
