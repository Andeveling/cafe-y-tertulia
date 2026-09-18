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

const navClub = [
	{ title: "Sesiones", url: "/", icon: Home01Icon },
	{ title: "Materiales", url: "/materials", icon: Book01Icon },
	{ title: "Invitar", url: "/invite", icon: UserAdd01Icon },
];

const navCuenta = [{ title: "Perfil", url: "/profile", icon: UserCircleIcon }];

export type AppSidebarUser = {
	name: string;
	email: string;
	avatar?: string | null;
} | null;

export function AppSidebar({ user }: { user?: AppSidebarUser }) {
	const pathname = usePathname();

	if (pathname.startsWith("/auth")) return null;

	return (
		<Sidebar collapsible="offcanvas" variant="inset">
			<SidebarHeader className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							className="gap-3 data-active:bg-transparent"
							render={<Link href="/" />}
							isActive={pathname === "/"}
						>
							<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<HugeiconsIcon icon={Book01Icon} className="size-4" />
							</div>
							<div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
								<span className="font-semibold text-sm tracking-tight">
									Café y Tertulias
								</span>
								<span className="text-sm text-sidebar-foreground/60">
									El club te espera
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="gap-0">
				<SidebarGroup className="py-3">
					<SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-widest">
						Club
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className="gap-0.5">
							{navClub.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										tooltip={item.title}
										isActive={
											pathname === item.url ||
											(item.url !== "/" && pathname.startsWith(item.url))
										}
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
