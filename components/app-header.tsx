"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
			<nav aria-label="Migas de pan" className="min-w-0">
				<ol className="flex items-center gap-2 overflow-hidden text-xs">
					<li className="shrink-0">
						{breadcrumbs.length === 0 ? (
							<span className="font-medium">Inicio</span>
						) : (
							<Link
								href="/"
								className="text-muted-foreground hover:text-foreground"
							>
								Inicio
							</Link>
						)}
					</li>
					{breadcrumbs.map((breadcrumb, index) => {
						const isCurrent = index === breadcrumbs.length - 1;

						return (
							<li
								key={breadcrumb.href}
								className="flex min-w-0 items-center gap-2"
							>
								<span aria-hidden="true" className="text-muted-foreground">
									/
								</span>
								{isCurrent || !breadcrumb.href ? (
									<span aria-current="page" className="truncate font-medium">
										{breadcrumb.label}
									</span>
								) : (
									<Link
										href={breadcrumb.href}
										className="shrink-0 text-muted-foreground hover:text-foreground"
									>
										{breadcrumb.label}
									</Link>
								)}
							</li>
						);
					})}
				</ol>
			</nav>
		</header>
	);
}
