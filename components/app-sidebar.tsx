"use client";

import {
	Book01Icon,
	Home01Icon,
	UserAdd01Icon,
	UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	ActiveGroupSwitcher,
	type SwitcherGroup,
} from "@/components/active-group-switcher";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import { resolveActiveGroup } from "@/lib/groups/active-group";

const navClub = [
	{ title: "Sesiones", section: "sesiones" as const, icon: Home01Icon },
	{ title: "Materiales", section: "materiales" as const, icon: Book01Icon },
];

const navCuenta = [{ title: "Perfil", url: "/profile", icon: UserCircleIcon }];

export type AppSidebarUser = {
	name: string;
	email: string;
	avatar?: string | null;
} | null;

export function AppSidebar({
	user,
	groups = [],
	rememberedSlug = null,
}: {
	user?: AppSidebarUser;
	groups?: SwitcherGroup[];
	rememberedSlug?: string | null;
}) {
	const pathname = usePathname();

	if (pathname.startsWith("/auth")) return null;

	const active = resolveActiveGroup(groups, pathname, rememberedSlug);
	const canInvite = active?.role === "admin" && active.visibility === "private";

	return (
		<Sidebar collapsible="offcanvas">
			<SidebarHeader className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-2">
				<ActiveGroupSwitcher groups={groups} rememberedSlug={rememberedSlug} />
			</SidebarHeader>

			<SidebarContent className="gap-0">
				<nav aria-label="Navegación">
					<SidebarGroup className="py-3">
						<SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-widest">
							Club
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu className="gap-0.5">
								{navClub.map((item) => {
									const href = active
										? `/g/${active.slug}/${item.section}`
										: "/g";
									return (
										<SidebarMenuItem key={item.title}>
											<SidebarMenuButton
												tooltip={active ? item.title : "Elige un grupo"}
												disabled={!active}
												isActive={!!active && pathname.startsWith(href)}
												render={active ? <Link href={href} /> : undefined}
												className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
											>
												<HugeiconsIcon icon={item.icon} />
												<span>{item.title}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
								{canInvite ? (
									<SidebarMenuItem>
										<SidebarMenuButton
											tooltip="Invitar"
											isActive={pathname.startsWith(
												`/g/${active.slug}/ajustes`,
											)}
											render={<Link href={`/g/${active.slug}/ajustes`} />}
											className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
										>
											<HugeiconsIcon icon={UserAdd01Icon} />
											<span>Invitar</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								) : null}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					<SidebarSeparator className="mx-0" />

					<SidebarGroup className="py-3">
						<SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-widest">
							Cuenta
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu className="gap-0.5">
								{navCuenta.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											tooltip={item.title}
											isActive={pathname.startsWith(item.url)}
											render={<Link href={item.url} />}
											className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
										>
											<HugeiconsIcon icon={item.icon} />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</nav>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border">
				{user ? (
					<NavUser user={user} />
				) : (
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								tooltip="Iniciar sesión"
								render={<Link href="/auth/login" />}
							>
								<HugeiconsIcon icon={UserCircleIcon} />
								<span>Iniciar sesión</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				)}
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
