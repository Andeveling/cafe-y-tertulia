"use client";

import { Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	type BoardSession,
	sessionTitle,
	statusMeta,
	whenLabel,
} from "./board-helpers";

export function SessionRow({ session }: { session: BoardSession }) {
	const meta = statusMeta(session.status);
	return (
		<li className="flex items-center justify-between gap-3 px-5 py-3.5">
			<div className="flex min-w-0 items-center gap-3">
				<span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-transparent">
					<HugeiconsIcon
						icon={Clock01Icon}
						className="size-3.5 text-muted-foreground"
						strokeWidth={1.6}
						aria-hidden="true"
					/>
				</span>
				<div className="min-w-0">
					<span className="block truncate text-sm font-normal leading-tight">
						{sessionTitle(session)}
					</span>
					{session.scheduled_at && (
						<span className="text-xs font-light text-muted-foreground">
							{whenLabel(session.scheduled_at)}
						</span>
					)}
				</div>
			</div>
			<Button
				size="sm"
				variant="ghost"
				className="shrink-0"
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
				{meta.live ? "Entrar" : "Ver"}
			</Button>
		</li>
	);
}
