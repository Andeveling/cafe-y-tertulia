"use client";

import { usePathname } from "next/navigation";
import type { MemberLevel } from "@/app/profile/_lib/gamification-actions";
import { AppHeader } from "@/components/app-header";
import { AppSidebar, type AppSidebarUser } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { isAuthPath, isSalaPath } from "@/lib/sala-path";

/**
 * Chrome por ruta. Tres topologías:
 * - Sala: pantalla completa; el Escenario aporta su propio `<main>`.
 * - Auth: sin sidebar ni header; este shell aporta `<main>`.
 * - Club: sidebar persistida + header + pozo contenido (1200 / 16–24–48).
 */
export function AppShell({
	user,
	defaultOpen,
	level,
	inbox,
	children,
}: {
	user?: AppSidebarUser;
	defaultOpen: boolean;
	level?: MemberLevel | null;
	inbox?: React.ReactNode;
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	if (isSalaPath(pathname)) {
		return (
			<div className="flex min-h-full flex-col">
				{children}
				<Toaster />
			</div>
		);
	}

	if (isAuthPath(pathname)) {
		return (
			<div className="flex min-h-dvh flex-col">
				<main className="flex min-h-dvh flex-1 flex-col">{children}</main>
				<Toaster />
			</div>
		);
	}

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<a
				href="#contenido"
				className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-sidebar-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-sidebar-primary-foreground"
			>
				Saltar al contenido
			</a>
			<AppSidebar user={user} />
			<SidebarInset className="w-full">
				<AppHeader level={level} />
				<div
					id="contenido"
					tabIndex={-1}
					className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-12 lg:py-12"
				>
					{children}
				</div>
			</SidebarInset>
			<Toaster />
			{inbox}
		</SidebarProvider>
	);
}
