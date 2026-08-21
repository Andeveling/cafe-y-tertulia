"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";

const labels: Record<string, string> = {
	invite: "Invitar",
	lobby: "Sorteo",
	materials: "Materiales",
	minigames: "Minijuegos",
	new: "Nuevo material",
	profile: "Perfil",
	rating: "Valoración",
	sessions: "Sesiones",
	stage: "Escenario",
};

export function getBreadcrumbs(pathname: string) {
	const parts = pathname.split("/").filter(Boolean);

	return parts.map((part, index) => ({
		href:
			part === "sessions"
				? undefined
				: `/${parts.slice(0, index + 1).join("/")}`,
		label:
			labels[part] ?? (parts[index - 1] === "sessions" ? "Sesión" : "Material"),
	}));
}

export function AppHeader() {
	const pathname = usePathname();
	const { open } = useSidebarPreference();
	if (pathname.startsWith("/auth")) return null;
	const breadcrumbs = getBreadcrumbs(pathname);

	return (
		<header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
			<SidebarTrigger className="-ml-1" aria-expanded={open} />
			<Breadcrumb aria-label="Migas de pan" className="min-w-0">
				<BreadcrumbList className="flex-nowrap items-center gap-1.5 overflow-hidden sm:gap-2">
					<BreadcrumbItem>
						{breadcrumbs.length === 0 ? (
							<BreadcrumbPage className="font-medium">Inicio</BreadcrumbPage>
						) : (
							<BreadcrumbLink render={<Link href="/" />}>Inicio</BreadcrumbLink>
						)}
					</BreadcrumbItem>
					{breadcrumbs.map((breadcrumb, index) => {
						const isCurrent = index === breadcrumbs.length - 1;
						const key = breadcrumb.href ?? `${breadcrumb.label}-${index}`;

						return (
							<React.Fragment key={key}>
								<BreadcrumbSeparator />
								<BreadcrumbItem className="min-w-0">
									{isCurrent || !breadcrumb.href ? (
										<BreadcrumbPage className="max-w-[12rem] truncate font-medium sm:max-w-none">
											{breadcrumb.label}
										</BreadcrumbPage>
									) : (
										<BreadcrumbLink render={<Link href={breadcrumb.href} />}>
											{breadcrumb.label}
										</BreadcrumbLink>
									)}
								</BreadcrumbItem>
							</React.Fragment>
						);
					})}
				</BreadcrumbList>
			</Breadcrumb>
		</header>
	);
}
