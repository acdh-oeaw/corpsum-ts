export default defineNuxtRouteMiddleware(async (to, _from) => {
	// console.log("in route middleware");
	const auth = useAuth();
	if (!auth.isLoggedIn() && (to.path === "/en" || to.path === "/de")) return navigateTo("/en/login");
});
