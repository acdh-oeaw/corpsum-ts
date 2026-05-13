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

interface RegisterErrorResponse {
	errors?: import("@/utils/auth-validation").SignupFieldErrors;
}
