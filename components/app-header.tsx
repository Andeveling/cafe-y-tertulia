"use client";

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

export function AppHeader({ level }: { level?: MemberLevel | null }) {
	const { open } = useSidebarPreference();

	return (
		<header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
			<SidebarTrigger className="-ml-1" aria-expanded={open} />
			<div className="min-w-0 flex-1" />
			{level && <MemberLevelBar level={level} />}
			<ThemeToggle />
		</header>
	);
}
