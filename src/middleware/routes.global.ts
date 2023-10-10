export default defineNuxtRouteMiddleware(async (to, _from) => {
	// console.log("in route middleware");
	const auth = useAuth();
	if (["/login"].includes(to.path)) {
		return;
	}
	if (!auth.username) {
		return await navigateTo("/login");
	}
});
