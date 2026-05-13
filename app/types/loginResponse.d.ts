interface LoginResponse {
	loggedIn: boolean;
	user: string;
	expires: number;
}

interface RegisterResponse {
	registered: boolean;
	user: string;
	expires: number;
}
