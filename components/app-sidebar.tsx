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
	{ title: "Inicio", url: "/", icon: Home01Icon },
	{ title: "Materiales", url: "/materials", icon: Book01Icon },
];

const navCuenta = [
	{ title: "Invitar", url: "/invite", icon: UserAdd01Icon },
	{ title: "Perfil", url: "/profile", icon: UserCircleIcon },
];

export function AppSidebar() {
	const pathname = usePathname();

	if (pathname.startsWith("/auth")) return null;

	return (
		<Sidebar collapsible="icon" variant="sidebar">
			<SidebarHeader className="flex h-12 shrink-0 items-center border-b border-sidebar-border px-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							className="gap-3 data-active:bg-transparent"
							render={<Link href="/" />}
							isActive={pathname === "/"}
						>
							<div className="flex size-7 items-center justify-center rounded-none border border-sidebar-border bg-primary text-primary-foreground text-xs font-bold leading-none">
								C
							</div>
							<div className="flex flex-col gap-0.5 leading-none">
								<span className="font-semibold tracking-tight text-sm">
									Café y Tertulias
								</span>
								<span className="text-xs text-sidebar-foreground/60">
									El club te espera
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="gap-0">
				<SidebarGroup className="py-3">
					<SidebarGroupLabel className="px-2 text-xs tracking-widest">
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
										className="rounded-none border border-transparent data-active:border-sidebar-border data-active:bg-sidebar-accent"
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
					<SidebarGroupLabel className="px-2 text-xs tracking-widest">
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
										className="rounded-none border border-transparent data-active:border-sidebar-border data-active:bg-sidebar-accent"
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
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltip="Soporte"
							render={
								<a
									href="https://github.com/Andeveling/cafe-y-tertulia"
									target="_blank"
									rel="noreferrer"
								/>
							}
						>
							<HugeiconsIcon icon={UserCircleIcon} />
							<span>Soporte</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
