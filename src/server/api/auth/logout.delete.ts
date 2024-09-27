export default defineEventHandler(async (event) => {
  await clearAuth(event);
	return;
})
