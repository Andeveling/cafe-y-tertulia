"use client";

import { usePathname } from "next/navigation";
import type { MemberLevel } from "@/app/profile/_lib/gamification-actions";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	Progress,
	ProgressLabel,
	ProgressValue,
} from "@/components/ui/progress";
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
		<div className="hidden shrink-0 md:flex" data-slot="member-level">
			<Progress
				value={progress}
				className="w-36 gap-1"
				aria-label={`Nivel ${level.level}: ${level.title}`}
			>
				<div className="flex w-full items-center justify-between gap-2">
					<ProgressLabel className="truncate text-xs font-medium text-muted-foreground">
						{level.title}
					</ProgressLabel>
					<ProgressValue className="shrink-0 text-xs" />
				</div>
			</Progress>
		</div>
	);
}

export function AppHeader({ level }: { level?: MemberLevel | null }) {
	const pathname = usePathname();
	const { open } = useSidebarPreference();
	if (pathname.startsWith("/auth")) return null;

	return (
		<header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
			<SidebarTrigger className="-ml-1" aria-expanded={open} />
			<div className="min-w-0 flex-1" />
			{level && <MemberLevelBar level={level} />}
			<ThemeToggle />
		</header>
	);
}
