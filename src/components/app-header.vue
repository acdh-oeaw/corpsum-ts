<script lang="ts" setup>
import type { NavLinkProps } from "@/components/nav-link.vue";

const localeRoute = useLocaleRoute();
const { locale } = useI18n();

const t = useTranslations("AppHeader");

const auth = useAuth();

const links = {
	home: { href: { path: "/" }, label: t("links.home") },
	queries: { href: { path: "/queries" }, label: t("queries") },
} satisfies Record<string, { href: NavLinkProps["href"]; label: string }>;

async function logout() {
	auth.logout();
	await navigateTo(localeRoute("/login", locale.value));
}
</script>

<template>
	<header class="border-b border-neutral-200">
		<div class="container flex items-center justify-between gap-4 py-8">
			<nav :aria-label="t('navigation-main')">
				<ul class="flex items-center gap-4" role="list">
					<li>
						<NavLink href="/">
							<div class="relative mt-auto text-4xl font-thin">CorpSum</div>
						</NavLink>
					</li>
					<li v-for="(link, key) of links" :key="key" class="text-1xl font-medium">
						<NavLink :href="link.href">
							{{ link.label }}
						</NavLink>
					</li>
				</ul>
			</nav>
			<div class="flex items-center gap-4">
				<LocaleSwitcher />
				<Button v-if="auth.isLoggedIn()" size="lg" @click="logout"
					>Logout {{ auth.username }}</Button
				>
			</div>
		</div>
	</header>
</template>
