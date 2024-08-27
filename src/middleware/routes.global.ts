export default defineNuxtRouteMiddleware(async (to) => {
	// console.log("in route middleware");
	const auth = useAuth();
	if (!auth.isLoggedIn() && (to.path === "/en" || to.path === "/de")) await navigateTo("/en/login");
});
