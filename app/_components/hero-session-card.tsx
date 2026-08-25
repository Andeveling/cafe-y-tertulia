"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	type BoardSession,
	sessionTitle,
	statusMeta,
	whenLabel,
} from "./board-helpers";

export function HeroSessionCard({ session }: { session: BoardSession }) {
	const meta = statusMeta(session.status);
	return (
		<Card className="border-border/30 bg-card/40 shadow-none backdrop-blur-sm">
			<CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
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
					<h2 className="font-heading text-[23px] font-light leading-none tracking-tight text-foreground">
						{sessionTitle(session)}
					</h2>
					<p className="text-sm font-light leading-snug text-foreground/65">
						{session.material_title && session.range
							? `${session.material_title} — `
							: session.material_title
								? `${session.material_title} — `
								: ""}
						Modera {session.moderator_name ?? "—"}
					</p>
				</div>
				<Button
					size="lg"
					className="w-full shrink-0 rounded-full px-7 font-medium sm:w-auto"
					nativeButton={false}
					render={
						<Link
							href={
								meta.live
									? `/materials/sessions/${session.id}/room`
									: `/materials/sessions/${session.id}`
							}
						/>
					}
				>
					{meta.live ? "Entrar a la sala" : "Ver detalle"}
				</Button>
			</CardContent>
		</Card>
	);
}
