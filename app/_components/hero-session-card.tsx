"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
	type BoardSession,
	sessionTitle,
	statusMeta,
	whenLabel,
} from "./board-helpers";
import { BoardSessionAction } from "./board-session-action";

export function HeroSessionCard({ session }: { session: BoardSession }) {
	const meta = statusMeta(session.status);
	return (
		<Card>
			<CardContent className="flex flex-col gap-5 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						<span
							className={
								meta.live
									? "size-1.5 shrink-0 rounded-full bg-primary"
									: "size-1.5 shrink-0 rounded-full bg-muted-foreground/40"
							}
						/>
						<span>{meta.label}</span>
						{session.scheduled_at && (
							<span>· {whenLabel(session.scheduled_at)}</span>
						)}
					</div>
					<h2 className="font-heading text-2xl font-semibold leading-8 tracking-tight">
						{sessionTitle(session)}
					</h2>
					<p className="text-sm text-muted-foreground">
						{session.material_title && session.range
							? `${session.material_title} — `
							: session.material_title
								? `${session.material_title} — `
								: ""}
						Modera {session.moderator_name ?? "—"}
					</p>
				</div>
				<BoardSessionAction session={session} variant="hero" />
			</CardContent>
		</Card>
	);
}
