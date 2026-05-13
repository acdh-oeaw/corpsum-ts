import { z } from "zod";

export interface SignupPayload {
	username?: string;
	email?: string;
	password?: string;
	passwordConfirmation?: string;
}

export type SignupValidationCode =
	| "duplicate"
	| "email"
	| "match"
	| "password"
	| "required"
	| "username";

export type SignupSchemaValidationCode = Exclude<SignupValidationCode, "duplicate">;
export type SignupSchemaMessages = Record<SignupSchemaValidationCode, string>;

export const usernameMinLength = 3;
export const usernameMaxLength = 48;
export const passwordMinLength = 12;

const usernamePattern = /^[a-z0-9_-]+$/;
const symbolPattern = /[^A-Za-z0-9]/;

export const signupSchemaMessages = {
	email: "email",
	match: "match",
	password: "password",
	required: "required",
	username: "username",
} as const satisfies SignupSchemaMessages;

export function createSignupSchema(messages: SignupSchemaMessages) {
	const requiredString = z
		.string({
			invalid_type_error: messages.required,
			required_error: messages.required,
		})
		.min(1, messages.required);

	const schema = z
		.object({
			email: z.preprocess(normalizeText, requiredString.email(messages.email)),
			password: requiredString.refine((password) => {
				return password === "" || isStrongPassword(password);
			}, messages.password),
			passwordConfirmation: requiredString,
			username: z.preprocess(
				normalizeText,
				requiredString
					.min(usernameMinLength, messages.username)
					.max(usernameMaxLength, messages.username)
					.regex(usernamePattern, messages.username),
			),
		})
		.superRefine((values, context) => {
			if (values.passwordConfirmation !== "" && values.passwordConfirmation !== values.password) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					message: messages.match,
					path: ["passwordConfirmation"],
				});
			}
		});

	return z.preprocess((value) => {
		return isRecord(value) ? value : {};
	}, schema);
}

export const signupSchema = createSignupSchema(signupSchemaMessages);

export type NormalizedSignupPayload = z.infer<typeof signupSchema>;
export type SignupField = keyof NormalizedSignupPayload;
export type SignupFieldErrors = Partial<Record<SignupField, SignupValidationCode>>;

const signupFields: ReadonlySet<string> = new Set([
	"email",
	"password",
	"passwordConfirmation",
	"username",
]);

export function normalizeSignupPayload(payload: unknown): NormalizedSignupPayload {
	const values = isRecord(payload) ? payload : {};

	return {
		username: normalizeText(values.username),
		email: normalizeText(values.email),
		password: typeof values.password === "string" ? values.password : "",
		passwordConfirmation:
			typeof values.passwordConfirmation === "string" ? values.passwordConfirmation : "",
	};
}

export function validateSignupPayload(payload: unknown): {
	errors: SignupFieldErrors;
	values: NormalizedSignupPayload;
} {
	const result = signupSchema.safeParse(payload);
	if (result.success) {
		return { errors: {}, values: result.data };
	}

	return {
		errors: zodErrorToSignupFieldErrors(result.error),
		values: normalizeSignupPayload(payload),
	};
}

export function isStrongPassword(password: string): boolean {
	if (password.length < passwordMinLength) return false;

	const categories = [
		/[a-z]/.test(password),
		/[A-Z]/.test(password),
		/\d/.test(password),
		symbolPattern.test(password),
	];

	return categories.filter(Boolean).length >= 3;
}

export function hasSignupErrors(errors: SignupFieldErrors): boolean {
	return Object.values(errors).some(Boolean);
}

function normalizeText(value: unknown): string {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function zodErrorToSignupFieldErrors(error: z.ZodError): SignupFieldErrors {
	const errors: SignupFieldErrors = {};

	for (const issue of error.issues) {
		const [field] = issue.path;
		if (typeof field !== "string" || !signupFields.has(field) || errors[field as SignupField]) {
			continue;
		}

		errors[field as SignupField] = issue.message as SignupSchemaValidationCode;
	}

	return errors;
}
