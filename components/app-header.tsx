"use client";

import { usePathname } from "next/navigation";
import type { MemberLevel } from "@/app/profile/_lib/gamification-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";

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
		<div
			className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 md:flex"
			data-slot="member-level"
		>
			<span className="text-label-sm font-semibold tracking-wider text-muted-foreground uppercase">
				{level.title}
				<span className="text-foreground"> · {progress}%</span>
			</span>
			<Progress
				value={progress}
				className="w-16 gap-0"
				aria-label={`Nivel ${level.level}: ${level.title}`}
			/>
		</div>
	);
}

/** Título de chrome: una sola vez, el de la página. Nested routes keep the
 *  content heading (nombre del material, del miembro) as the document h1. */
function clubHeading(pathname: string): { title: string; as: "h1" | "p" } | null {
	if (pathname === "/") return { title: "Sesiones", as: "h1" };
	if (pathname === "/materials") return { title: "Materiales", as: "h1" };
	if (pathname === "/materials/new")
		return { title: "Proponer material", as: "h1" };
	if (/^\/materials\/sessions\/[^/]+$/.test(pathname))
		return { title: "Histórico", as: "p" };
	if (/^\/materials\/[^/]+$/.test(pathname))
		return { title: "Materiales", as: "p" };
	if (pathname === "/invite") return { title: "Invitar", as: "h1" };
	if (pathname === "/profile") return { title: "Perfil", as: "p" };
	if (pathname.startsWith("/members/")) return { title: "Miembro", as: "p" };
	return null;
}

export function AppHeader({ level }: { level?: MemberLevel | null }) {
	const pathname = usePathname();
	const { open } = useSidebarPreference();
	const heading = clubHeading(pathname);
	const titleClass =
		"min-w-0 flex-1 truncate font-heading text-lg font-semibold";

	return (
		<header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
			<SidebarTrigger className="-ml-1" aria-expanded={open} />
			{heading?.as === "h1" ? (
				<h1 className={titleClass}>{heading.title}</h1>
			) : heading ? (
				<p className={titleClass}>{heading.title}</p>
			) : (
				<div className="min-w-0 flex-1" />
			)}
			{level && <MemberLevelBar level={level} />}
			<ThemeToggle />
		</header>
	);
}
