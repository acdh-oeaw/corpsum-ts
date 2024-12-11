export default defineEventHandler(async (event) => {
	const {username} = await requireAuth(event);
	const { jwtExpiration } = useRuntimeConfig();

	await setAuth(event, username);

	return {
		username,
		expires: Date.now() + parseInt(jwtExpiration),
	};
});
