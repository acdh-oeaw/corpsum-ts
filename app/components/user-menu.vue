<script setup lang="ts">
import { useSidebar } from "@/components/ui/sidebar";

const auth = useAuth();

const { isMobile } = useSidebar();

const localeRoute = useLocaleRoute();
const { locale } = useI18n();

const logout = async () => {
	await auth.logout();
	return await navigateTo(localeRoute("/login", locale.value));
};
</script>

<template>
	<SidebarMenu>
		<SidebarMenuItem>
			<DropdownMenu>
				<DropdownMenuTrigger as-child>
					<SidebarMenuButton
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						size="lg"
					>
						<div
							class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
						>
							<LucideIcon class="size-4" name="User" :stroke-width="3" />
						</div>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">{{ auth.username }}</span>
							<span class="truncate text-xs">not yet</span>
						</div>
						<LucideIcon class="ml-auto size-4" name="ChevronsUpDown" />
					</SidebarMenuButton>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
					:side="isMobile ? 'bottom' : 'right'"
					:side-offset="4"
				>
					<DropdownMenuLabel class="p-0 font-normal">
						<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
							<LucideIcon class="size-4" name="User" :stroke-width="3" />
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-semibold">{{ auth.username }}</span>
								<span class="truncate text-xs">not yet</span>
							</div>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem>
							<LucideIcon name="BadgeCheck" />
							Account Settings
						</DropdownMenuItem>
						<DropdownMenuItem>
							<LucideIcon name="LockKeyhole" />
							Credential Management
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem @click="logout">
						<LucideIcon name="LogOut" />
						Log out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarMenuItem>
	</SidebarMenu>
</template>
