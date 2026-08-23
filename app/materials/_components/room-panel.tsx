"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StageBar } from "@/app/materials/_components/stage-bar";
import { StagePanel } from "@/app/materials/_components/stage-panel";
import { useRoomRealtime } from "@/app/materials/_hooks/use-room-realtime";
import {
	advanceRoomStage,
	confirmPresence,
	executeDraw,
	saveQuestion,
	toggleOptOut,
} from "@/app/materials/_lib/room-actions";
import type {
	RoomAssignment,
	RoomParticipant,
	RoomQuestion,
	RoomReadiness,
	RoomSnapshot,
	RoomStage,
} from "@/app/materials/_lib/room-types";
import {
	ROOM_STAGE_LABELS,
	ROOM_STAGE_ORDER,
} from "@/app/materials/_lib/room-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/server-action";

type Props = {
	snapshot: RoomSnapshot;
	userId: string;
	isModerator: boolean;
};

export function RoomPanel({ snapshot, userId, isModerator }: Props) {
	useRoomRealtime(snapshot.sessionId);

	return (
		<div className="flex flex-col gap-4">
			<StageBar current={snapshot.roomStage} />

			<StageContent
				snapshot={snapshot}
				userId={userId}
				isModerator={isModerator}
			/>

			{isModerator && <ModeratorNav snapshot={snapshot} />}
		</div>
	);
}

// ─── Stage Router ───────────────────────────────────────────

function StageContent({
	snapshot,
	userId,
	isModerator,
}: {
	snapshot: RoomSnapshot;
	userId: string;
	isModerator: boolean;
}) {
	switch (snapshot.roomStage) {
		case "questions":
			return (
				<QuestionsStage
					sessionId={snapshot.sessionId}
					materialId={snapshot.materialId}
					questions={snapshot.questions}
					participants={snapshot.participants}
					userId={userId}
				/>
			);
		case "presence":
			return (
				<PresenceStage
					sessionId={snapshot.sessionId}
					participants={snapshot.participants}
					readiness={snapshot.readiness}
					userId={userId}
					isModerator={isModerator}
				/>
			);
		case "draw":
			return (
				<DrawStage
					snapshot={snapshot}
					userId={userId}
					isModerator={isModerator}
				/>
			);
		case "debate":
			if (!snapshot.debate) return null;
			return (
				<StagePanel
					debate={snapshot.debate}
					sessionId={snapshot.sessionId}
					userId={userId}
					isModerator={isModerator}
				/>
			);
	}
}

// ─── Moderator Navigation ───────────────────────────────────

function ModeratorNav({ snapshot }: { snapshot: RoomSnapshot }) {
	const [pending, start] = useTransition();
	const currentIdx = ROOM_STAGE_ORDER.indexOf(snapshot.roomStage);
	const nextStage = ROOM_STAGE_ORDER[currentIdx + 1] as RoomStage | undefined;

	if (!nextStage) return null;

	function handleAdvance() {
		start(async () => {
			const r = await advanceRoomStage(snapshot.sessionId, nextStage!);
			if (!r.ok) toast.error(r.error);
		});
	}

	return (
		<div className="flex justify-end">
			<Button
				size="sm"
				variant="outline"
				disabled={pending}
				onClick={handleAdvance}
			>
				Ir a {ROOM_STAGE_LABELS[nextStage!]} →
			</Button>
		</div>
	);
}

// ─── Questions Stage ────────────────────────────────────────

function QuestionsStage({
	sessionId,
	materialId,
	questions,
	participants,
	userId,
}: {
	sessionId: string;
	materialId: string;
	questions: RoomQuestion[];
	participants: RoomParticipant[];
	userId: string;
}) {
	const [pending, start] = useTransition();
	const [text, setText] = useState("");

	const myQuestions = questions.filter((q) => q.isMine);
	const myCount = myQuestions.length;

	function handleSubmit() {
		const trimmed = text.trim();
		if (!trimmed) return;
		start(async () => {
			const r = await saveQuestion(sessionId, materialId, trimmed);
			if (!r.ok) {
				toast.error(r.error);
			} else {
				setText("");
				toast.success(`Pregunta ${myCount + 1} enviada`);
			}
		});
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Escribe tu pregunta</CardTitle>
					<CardDescription>
						Tu texto es privado. Los demás solo ven que enviaste una.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<Textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						rows={3}
						placeholder="¿Qué pregunta quieres hacer sobre el material?"
						disabled={pending}
					/>
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground">
							{myCount > 0
								? `${myCount} pregunta${myCount > 1 ? "s" : ""} enviada${myCount > 1 ? "s" : ""}`
								: "Ninguna enviada aún"}
						</span>
						<Button
							size="sm"
							disabled={pending || !text.trim()}
							onClick={handleSubmit}
						>
							Enviar pregunta
						</Button>
					</div>
				</CardContent>
			</Card>

			{myQuestions.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Tus preguntas</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="flex flex-col gap-2">
							{myQuestions.map((q) => (
								<li
									key={q.id}
									className="rounded-md border border-border p-3 text-sm"
								>
									{q.text}
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Participantes</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="flex flex-col gap-2">
						{participants.map((p) => {
							const hasQuestion = questions.some(
								(q) => q.authorId === p.memberId,
							);
							return (
								<li
									key={p.memberId}
									className="flex items-center justify-between text-sm"
								>
									<span>
										{p.displayName}
										{p.role === "spectator" && (
											<Badge variant="outline" className="ml-2">
												Espectador
											</Badge>
										)}
									</span>
									{p.role === "member" && (
										<Badge variant={hasQuestion ? "secondary" : "outline"}>
											{hasQuestion ? "✓ enviado" : "pendiente"}
										</Badge>
									)}
								</li>
							);
						})}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Presence Stage ─────────────────────────────────────────

function PresenceStage({
	sessionId,
	participants,
	readiness,
	userId,
	isModerator,
}: {
	sessionId: string;
	participants: RoomParticipant[];
	readiness: RoomReadiness;
	userId: string;
	isModerator: boolean;
}) {
	const [pending, start] = useTransition();
	const me = participants.find((p) => p.memberId === userId);
	const members = participants.filter((p) => p.role === "member");
	const spectators = participants.filter((p) => p.role === "spectator");

	function handleConfirm() {
		start(async () => {
			const r = await confirmPresence(sessionId);
			if (!r.ok) toast.error(r.error);
		});
	}

	function handleToggleOptOut() {
		if (!me) return;
		start(async () => {
			const r = await toggleOptOut(sessionId, me.optOut);
			if (!r.ok) toast.error(r.error);
		});
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Presentes</CardTitle>
					<CardDescription>
						Confirma tu asistencia. Listo = presente + al menos 1 pregunta.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{/* Readiness indicator */}
					<div className="flex items-center gap-3 rounded-lg bg-muted p-4">
						<span className="text-2xl font-heading font-semibold">
							{readiness.ready}/{readiness.total}
						</span>
						<span className="text-sm text-muted-foreground">Listos</span>
						{readiness.allReady && (
							<Badge variant="default" className="ml-auto">
								Todos listos
							</Badge>
						)}
					</div>

					{/* Members list */}
					<ul className="flex flex-col gap-2">
						{members.map((p) => (
							<li
								key={p.memberId}
								className="flex items-center justify-between text-sm"
							>
								<span>
									{p.displayName}
									{p.memberId === userId && " · Vos"}
								</span>
								<div className="flex gap-2">
									{p.optOut && <Badge variant="outline">Sin sorteo</Badge>}
								</div>
							</li>
						))}
					</ul>

					{spectators.length > 0 && (
						<div>
							<p className="text-xs text-muted-foreground mb-2">
								Espectadores:
							</p>
							<ul className="flex flex-col gap-1">
								{spectators.map((p) => (
									<li
										key={p.memberId}
										className="text-sm text-muted-foreground"
									>
										{p.displayName}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Actions */}
					<div className="flex flex-wrap gap-2 pt-2">
						{!me ? (
							<Button size="sm" disabled={pending} onClick={handleConfirm}>
								Estoy presente
							</Button>
						) : (
							<>
								{me.role === "member" && (
									<Button
										size="sm"
										variant="outline"
										disabled={pending}
										onClick={handleToggleOptOut}
									>
										{me.optOut ? "Entrar al sorteo" : "Sin sorteo"}
									</Button>
								)}
							</>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Draw Stage ─────────────────────────────────────────────

function DrawStage({
	snapshot,
	userId,
	isModerator,
}: {
	snapshot: RoomSnapshot;
	userId: string;
	isModerator: boolean;
}) {
	const [pending, start] = useTransition();
	const { draw, assignments, readiness } = snapshot;

	function handleDraw() {
		start(async () => {
			const r = await executeDraw(snapshot.sessionId);
			if (!r.ok) toast.error(r.error);
		});
	}

	if (draw.done) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Sorteo</CardTitle>
					<CardDescription>
						Parejas visibles. El texto se revela en el debate.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{assignments.length > 0 ? (
						<ul className="flex flex-col gap-2">
							{assignments.map((a) => (
								<AssignmentRow key={a.assignmentId} assignment={a} />
							))}
						</ul>
					) : (
						<p className="text-sm text-muted-foreground">
							Sorteo listo · sin asignaciones.
						</p>
					)}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Sorteo</CardTitle>
				<CardDescription>
					Una sola vez. El texto se revela durante el debate.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<div className="flex items-center gap-3 rounded-lg bg-muted p-4">
					<span className="text-2xl font-heading font-semibold">
						{readiness.ready}/{readiness.total}
					</span>
					<span className="text-sm text-muted-foreground">Listos</span>
					{readiness.allReady && (
						<Badge variant="default" className="ml-auto">
							Todos listos
						</Badge>
					)}
				</div>

				{isModerator ? (
					<Button
						disabled={pending || !readiness.allReady}
						onClick={handleDraw}
					>
						Ejecutar sorteo
					</Button>
				) : (
					<p className="text-sm text-muted-foreground">
						Espera a que el moderador ejecute el sorteo.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

// ─── Assignment Row ─────────────────────────────────────────

function AssignmentRow({ assignment }: { assignment: RoomAssignment }) {
	const stateLabels: Record<string, string> = {
		hidden: "Oculta",
		preparation: "Revelando",
		exposition: "Revelando",
		complement: "Revelando",
		complete: "Revelada",
	};
	const stateVariants: Record<string, "secondary" | "outline" | "default"> = {
		hidden: "outline",
		preparation: "secondary",
		exposition: "secondary",
		complement: "secondary",
		complete: "default",
	};

	return (
		<li className="flex flex-col gap-1 rounded-md border border-border p-3 text-sm">
			<div className="flex items-center justify-between gap-2">
				<span>
					{assignment.authorName} → {assignment.assigneeName}
				</span>
				<Badge variant={stateVariants[assignment.state] ?? "outline"}>
					{stateLabels[assignment.state] ?? assignment.state}
				</Badge>
			</div>
			{assignment.questionVisible && assignment.questionText ? (
				<p className="text-xs text-muted-foreground">
					{assignment.questionText}
				</p>
			) : (
				<p className="text-xs text-muted-foreground italic">
					Pregunta oculta hasta el debate
				</p>
			)}
		</li>
	);
}
