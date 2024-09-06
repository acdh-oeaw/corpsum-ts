<script lang="ts" setup>
import type { NavLinkProps } from "@/components/nav-link.vue";
import { Button } from "@/components/ui/button";
import {navigateTo} from "#app";

const t = useTranslations("AppHeader");

const auth = useAuth();

const links = {
	home: { href: { path: "/en" }, label: t("links.home") },
	// corpsum: { href: { path: "/corpsum" }, label: t("links.corpsum") },
} satisfies Record<string, { href: NavLinkProps["href"]; label: string }>;

async function logout() {
	auth.logout();
	await navigateTo("/en/login");
}
</script>

<template>
	<header class="border-b border-neutral-200">
		<div class="container flex items-center justify-between gap-4 py-8">
			<nav :aria-label="t('navigation-main')">
				<ul class="flex items-center gap-4" role="list">
					<li v-for="(link, key) of links" :key="key">
						<NavLink :href="link.href">
							{{ link.label }}
						</NavLink>
					</li>
				</ul>
			</nav>

			<LocaleSwitcher />
			<Button v-if="auth.isLoggedIn()" size="lg" @click="logout">Logout {{ auth.username }}</Button>
		</div>
	</header>
</template>
