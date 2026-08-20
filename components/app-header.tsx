"use client";

import { usePathname } from "next/navigation";

import { SidebarTrigger } from "@/components/ui/sidebar";

const titles: Record<string, string> = {
	"/": "Inicio",
	"/materials": "Materiales",
	"/invite": "Invitar",
	"/profile": "Perfil",
};

function getTitle(pathname: string) {
	if (titles[pathname]) return titles[pathname];
	if (pathname.startsWith("/materials")) return "Material";
	if (pathname.startsWith("/invite")) return "Invitar";
	if (pathname.startsWith("/profile")) return "Perfil";
	return "Café y Tertulias";
}

export function AppHeader() {
	const pathname = usePathname();
	if (pathname.startsWith("/auth")) return null;

	return (
		<header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
			<SidebarTrigger className="-ml-1" />
			<div className="h-4 w-px bg-border" />
			<span className="text-xs font-medium tracking-tight">
				{getTitle(pathname)}
			</span>
			<span className="hidden text-xs text-muted-foreground sm:inline">
				— el club te espera
			</span>
		</header>
	);
}
