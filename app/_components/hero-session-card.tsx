"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { MemberAvatar } from "@/components/member-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
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
	daysUntilLabel,
	editorialTitle,
	sessionHasBoardCta,
	sessionSubtitle,
	splitHeadline,
	statusMeta,
	whenLabel,
} from "./board-helpers";
import { BoardSessionAction } from "./board-session-action";
import { PrepareQuestionForm } from "./prepare-question-form";

export function HeroSessionCard({ session }: { session: BoardSession }) {
	const [askOpen, setAskOpen] = useState(false);
	const meta = statusMeta(session.status);
	const title = editorialTitle(session);
	const { lead, accent } = splitHeadline(title);
	const subtitle = sessionSubtitle(session);
	const when = session.scheduled_at ? whenLabel(session.scheduled_at) : null;
	const hasCta = sessionHasBoardCta(session);
	const waiting =
		session.status === "preparation" && Boolean(session.scheduled_at);
	const days = waiting ? daysUntilLabel(session.scheduled_at) : null;

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
							aria-hidden="true"
							className={cn(
								"size-1.5 shrink-0 rounded-full",
								meta.live ? "bg-primary" : "bg-muted-foreground/40",
							)}
						/>
						{meta.live ? `${meta.label} · Live` : meta.label}
					</Badge>
					{when && !meta.live && !waiting ? (
						<Badge variant="outline">{when}</Badge>
					) : null}
				</div>
				<h2
					data-slot="card-title"
					className="max-w-[22ch] font-heading text-3xl leading-tight font-medium tracking-tight text-balance lg:text-[3rem] lg:leading-[3.5rem]"
				>
					{lead}
					{accent ? (
						<>
							{" "}
							<em className="text-primary italic">{accent}</em>
						</>
					) : null}
				</h2>
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
					<MemberAvatar
						name={session.moderator_name ?? "Moderador"}
						avatar={session.moderator_avatar}
						size="sm"
					/>
				</p>
				<div className="flex flex-col gap-3">
					{days ? (
						<p className="text-sm text-muted-foreground">{days}</p>
					) : null}
					<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
						{hasCta ? (
							<BoardSessionAction session={session} variant="hero">
								<HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
							</BoardSessionAction>
						) : null}
						{waiting ? (
							<Sheet
								key="ask-question"
								open={askOpen}
								onOpenChange={setAskOpen}
							>
								<SheetTrigger
									render={<Button size="lg" className="w-full sm:w-auto" />}
								>
									Agrega tu pregunta
								</SheetTrigger>
								<SheetContent>
									<SheetHeader>
										<SheetTitle>Agrega tu pregunta</SheetTitle>
										<SheetDescription>
											{days ? `${days}. ` : null}
											Así la tertulia es para hablar.
										</SheetDescription>
									</SheetHeader>
									<PrepareQuestionForm
										sessionId={session.id}
										onSuccess={() => setAskOpen(false)}
									/>
								</SheetContent>
							</Sheet>
						) : (
							<Sheet key="program">
								<SheetTrigger
									render={
										<Button
											variant={hasCta ? "outline" : "default"}
											size="lg"
											className="w-full sm:w-auto"
										/>
									}
								>
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
											{when && !meta.live ? ` · ${when}` : ""}
										</SheetDescription>
									</SheetHeader>
									{subtitle ? (
										<div className="flex flex-col gap-2 px-4 text-sm text-muted-foreground">
											<p>{subtitle}</p>
										</div>
									) : null}
									{hasCta ? (
										<SheetFooter>
											<BoardSessionAction
												session={session}
												variant="hero"
												fullWidth
											>
												<HugeiconsIcon
													icon={ArrowRight01Icon}
													data-icon="inline-end"
												/>
											</BoardSessionAction>
										</SheetFooter>
									) : null}
								</SheetContent>
							</Sheet>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
