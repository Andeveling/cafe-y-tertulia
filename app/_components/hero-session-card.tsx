"use client";

import { ArrowRight01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
	type BoardSession,
	editorialTitle,
	sessionSubtitle,
	splitHeadline,
	startedAgo,
	statusMeta,
	whenLabel,
} from "./board-helpers";
import { BoardSessionAction } from "./board-session-action";

export function HeroSessionCard({ session }: { session: BoardSession }) {
	const meta = statusMeta(session.status);
	const title = editorialTitle(session);
	const { lead, accent } = splitHeadline(title);
	const subtitle = sessionSubtitle(session);
	const ago = meta.live ? startedAgo(session.scheduled_at) : null;
	const when = session.scheduled_at ? whenLabel(session.scheduled_at) : null;
	const initial = (session.moderator_name || "?").slice(0, 1).toUpperCase();

	return (
		<Card className="relative overflow-hidden">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_260px_at_82%_8%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_65%)]"
			/>
			<CardHeader className="relative gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline">
						<span
							className={cn(
								"size-1.5 shrink-0 rounded-full",
								meta.live ? "bg-primary" : "bg-muted-foreground/40",
							)}
						/>
						{meta.live ? `${meta.label} · Live` : meta.label}
					</Badge>
					{when && !meta.live && <Badge variant="outline">{when}</Badge>}
				</div>
				<CardTitle className="max-w-[22ch] text-3xl leading-tight tracking-tight md:text-[2.5rem] md:leading-tight">
					{lead}
					{accent ? (
						<>
							{" "}
							<em className="text-primary italic">{accent}</em>
						</>
					) : null}
				</CardTitle>
				{subtitle && (
					<CardDescription className="font-heading italic">
						{subtitle}
					</CardDescription>
				)}
			</CardHeader>
			<CardContent className="relative flex flex-col gap-6">
				<p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
					<span>
						Modera{" "}
						<span className="font-medium text-foreground">
							{session.moderator_name ?? "—"}
						</span>
					</span>
					{ago && (
						<>
							<span aria-hidden="true">·</span>
							<span>{ago}</span>
						</>
					)}
					<Avatar size="sm">
						<AvatarFallback>{initial}</AvatarFallback>
					</Avatar>
				</p>
				<div className="flex flex-wrap gap-3">
					<BoardSessionAction session={session} variant="hero">
						<HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
					</BoardSessionAction>
					<Sheet>
						<SheetTrigger render={<Button variant="outline" size="lg" />}>
							Ver programa
						</SheetTrigger>
						<SheetContent>
							<SheetHeader>
								<Badge variant="outline">
									<span
										className={cn(
											"size-1.5 shrink-0 rounded-full",
											meta.live ? "bg-primary" : "bg-muted-foreground/40",
										)}
									/>
									{meta.label}
								</Badge>
								<SheetTitle>{title}</SheetTitle>
								<SheetDescription>
									Modera {session.moderator_name ?? "—"}
									{ago ? ` · ${ago}` : when ? ` · ${when}` : ""}
								</SheetDescription>
							</SheetHeader>
							<div className="flex flex-col gap-2 px-4 text-sm text-muted-foreground">
								{subtitle && <p>{subtitle}</p>}
								{when && <p>{when}</p>}
							</div>
							<SheetFooter>
								<BoardSessionAction session={session} variant="hero" fullWidth>
									<HugeiconsIcon
										icon={ArrowRight01Icon}
										data-icon="inline-end"
									/>
								</BoardSessionAction>
							</SheetFooter>
						</SheetContent>
					</Sheet>
				</div>
			</CardContent>
			{(when || subtitle) && (
				<CardFooter className="relative flex flex-wrap gap-4 text-xs text-muted-foreground">
					{when && (
						<span className="flex items-center gap-2">
							<HugeiconsIcon icon={Clock01Icon} />
							{when}
						</span>
					)}
					{subtitle && <span>{subtitle}</span>}
				</CardFooter>
			)}
		</Card>
	);
}
