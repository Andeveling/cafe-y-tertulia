"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import type { MemberLevel } from "@/app/profile/_lib/gamification-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
	Progress,
	ProgressLabel,
	ProgressValue,
} from "@/components/ui/progress";
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

function MemberLevelBar({ level }: { level: MemberLevel }) {
	if (level.level === 0 && level.sessionsAttended === 0) return null;

	const progress =
		level.nextThreshold > level.currentThreshold
			? Math.min(
					100,
					Math.round(
						((level.sessionsAttended - level.currentThreshold) /
							(level.nextThreshold - level.currentThreshold)) *
							100,
					),
				)
			: 100;

	return (
		<div className="hidden items-center gap-2 sm:flex" data-slot="member-level">
			<Progress
				value={progress}
				className="w-24"
				aria-label={`Nivel ${level.level}: ${level.title}`}
			>
				<ProgressLabel className="text-xs font-medium text-muted-foreground">
					{level.title}
				</ProgressLabel>
				<ProgressValue className="text-xs" />
			</Progress>
		</div>
	);
}

export function AppHeader({ level }: { level?: MemberLevel | null }) {
	const pathname = usePathname();
	const { open } = useSidebarPreference();
	if (pathname.startsWith("/auth")) return null;
	const breadcrumbs = getBreadcrumbs(pathname);

	return (
		<header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
			<SidebarTrigger className="-ml-1" aria-expanded={open} />
			<Breadcrumb aria-label="Migas de pan" className="min-w-0 flex-1">
				<BreadcrumbList className="flex-nowrap items-center gap-1.5 overflow-hidden sm:gap-2">
					<BreadcrumbItem>
						{breadcrumbs.length === 0 ? (
							<BreadcrumbPage className="font-medium text-base">
								Inicio
							</BreadcrumbPage>
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
			{level && <MemberLevelBar level={level} />}
			<ThemeToggle />
		</header>
	);
}
