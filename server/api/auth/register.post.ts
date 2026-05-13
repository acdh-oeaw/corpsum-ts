import { hashSync } from "bcryptjs";

import {
	hasSignupErrors,
	validateSignupPayload,
	type SignupFieldErrors,
} from "@/utils/auth-validation";
import { UserModel } from "~/server/models/users.schema";
import { setAuth } from "~/server/utils/auth";

const { jwtExpiration } = useRuntimeConfig();

export default defineEventHandler(async (event) => {
	const payload = await readBody<unknown>(event);
	const { errors, values } = validateSignupPayload(payload);

	if (hasSignupErrors(errors)) {
		setResponseStatus(event, 400, "validation failed");
		return { errors };
	}

	const duplicateErrors: SignupFieldErrors = {};
	const [existingUsername, existingEmail] = await Promise.all([
		UserModel.exists({ username: values.username }),
		UserModel.exists({ email: values.email }),
	]);

	if (existingUsername) {
		duplicateErrors.username = "duplicate";
	}
	if (existingEmail) {
		duplicateErrors.email = "duplicate";
	}
	if (hasSignupErrors(duplicateErrors)) {
		setResponseStatus(event, 409, "user already exists");
		return { errors: duplicateErrors };
	}

	const hashed = hashSync(values.password, 10);

	try {
		await UserModel.create({
			accounttype: "user",
			email: values.email,
			password: hashed,
			username: values.username,
		});
	} catch (error) {
		if (isDuplicateKeyError(error)) {
			setResponseStatus(event, 409, "user already exists");
			return { errors: { email: "duplicate", username: "duplicate" } satisfies SignupFieldErrors };
		}

		setResponseStatus(event, 500, "database error");
		return `ERROR: ${error as string}`;
	}

	await setAuth(event, values.username);

	return {
		registered: true,
		user: values.username,
		expires: Date.now() + parseInt(jwtExpiration),
	};
});

function isDuplicateKeyError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code: unknown }).code === 11000
	);
}
