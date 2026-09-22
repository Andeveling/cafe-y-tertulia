"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import {
	advanceRoomStage,
	advanceToDraw,
} from "@/app/materials/_lib/room-actions";
import {
	ROOM_STAGE_LABELS,
	type RoomSnapshot,
	type RoomStage,
} from "@/app/materials/_lib/room-types";
import type { SalaView } from "@/app/materials/_lib/room-view";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Texto del tooltip del ModeratorNav por etapa. Cada entrada describe:
 *  - `description`: en qué consiste la etapa actual.
 *  - `nextCondition`: qué tiene que estar dado para avanzar.
 * La `key` es la etapa actual; la siguiente sale de `view.next`.
 */
const STAGE_HELP: Record<
	RoomStage,
	{ description: string; nextCondition: string }
> = {
	questions: {
		description:
			"Cada miembro escribe su pregunta en privado. Los demás solo ven que la enviaron.",
		nextCondition:
			"Hacen falta al menos 2 participantes, cada uno con una pregunta.",
	},
	presence: {
		description:
			"Los miembros se sientan a la mesa. Listo = presente con al menos 1 pregunta.",
		nextCondition:
			"Todos los miembros deben estar Listos para ir a Sorteo (el sorteo se ejecuta al entrar).",
	},
	draw: {
		description:
			"Las parejas se asignan al azar; la pregunta se revela recién en el debate.",
		nextCondition: "El sorteo ya fijó el orden. El texto sigue oculto.",
	},
	debate: {
		description:
			"Las parejas exponen y complementan por turno. El moderador revela y avanza cada turno.",
		nextCondition: "Todos los turnos deben estar completos.",
	},
	cierre: {
		description:
			"Fin de la tertulia. El moderador cierra la sesión cuando no queda nada pendiente.",
		nextCondition: "",
	},
};

// ─── Moderator Navigation ───────────────────────────────────

/** Volver atrás dentro del Debate: ghost sutil + confirmación. */
function DebateBackConfirm({
	prevLabel,
	pending,
	onConfirm,
}: {
	prevLabel: string;
	pending: boolean;
	onConfirm: () => void;
}) {
	return (
		<Dialog>
			<DialogTrigger
				render={
					<Button variant="ghost" size="sm" disabled={pending}>
						<HugeiconsIcon
							icon={ArrowLeft01Icon}
							strokeWidth={2}
							data-icon="inline-start"
							aria-hidden="true"
						/>
						Volver a {prevLabel}
					</Button>
				}
			/>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>¿Volver a {prevLabel}?</DialogTitle>
					<DialogDescription>
						Los turnos ya revelados quedan como están.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="outline" size="sm" />}>
						Cancelar
					</DialogClose>
					<Button size="sm" disabled={pending} onClick={onConfirm}>
						Volver de todos modos
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function ModeratorNav({
	snapshot,
	view,
	onAdvance,
	pending: pendingOverride,
	advanceDisabled = false,
	advanceLabel,
}: {
	snapshot: RoomSnapshot;
	view: SalaView;
	/**
	 * Reemplaza el avance genérico cuando la etapa tiene trabajo propio
	 * antes de mover la Sala (Preguntas: pasar faltantes a espectador).
	 * Si no se pasa, avanza con `advanceRoomStage`.
	 */
	onAdvance?: () => void;
	/** Pending externo cuando el avance lo ejecuta la etapa, no el nav. */
	pending?: boolean;
	/** La etapa aún no cumple su condición (p. ej. faltan preguntas). */
	advanceDisabled?: boolean;
	/** Copy del botón de avance. Default: "Continuar a {etapa}". */
	advanceLabel?: string;
}) {
	const { pending: ownPending, run } = useRoomMutation();
	const pending = pendingOverride ?? ownPending;
	const { next, prev, backBlocked, empty, warnings } = view;

	if (!next) return null;

	const showBack = !!prev && !backBlocked;

	function handleAdvance() {
		if (!next) return;
		if (onAdvance) {
			onAdvance();
			return;
		}
		// Entrar a Sorteo ES sortear (una sola vez): mata el paso previo.
		// Al volver a una Sorteo ya sorteada, avance normal sin re-sortear.
		if (next === "draw" && !snapshot.draw.done) {
			run(() => advanceToDraw(snapshot.sessionId));
			return;
		}
		run(() => advanceRoomStage(snapshot.sessionId, next));
	}

	function handleBack() {
		if (!prev) return;
		run(() => advanceRoomStage(snapshot.sessionId, prev));
	}

	// En Debate la conducción vive en el Escenario (revelar/continuar);
	// esta nav queda fija abajo para no perderse con el scroll y Volver
	// pide confirmación.
	const isDebate = snapshot.roomStage === "debate";
	const navClass = isDebate
		? "sticky bottom-0 flex items-center justify-between gap-2 border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80"
		: "flex items-center justify-between gap-2";

	const backButton =
		showBack && prev ? (
			isDebate ? (
				<DebateBackConfirm
					prevLabel={ROOM_STAGE_LABELS[prev]}
					pending={pending}
					onConfirm={handleBack}
				/>
			) : (
				<Button variant="outline" disabled={pending} onClick={handleBack}>
					<HugeiconsIcon
						icon={ArrowLeft01Icon}
						strokeWidth={2}
						data-icon="inline-start"
						aria-hidden="true"
					/>
					Volver a {ROOM_STAGE_LABELS[prev]}
				</Button>
			)
		) : (
			<span />
		);

	// Sin participantes el avance queda bloqueado del todo: sin diálogo de
	// "avanzar de todos modos".
	if (empty) {
		return (
			<div className="flex items-center justify-between gap-2">
				{backButton}
				<div className="flex flex-col items-end gap-1">
					<Button variant="default" disabled>
						Continuar a {ROOM_STAGE_LABELS[next]}
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							strokeWidth={2}
							data-icon="inline-end"
							aria-hidden="true"
						/>
					</Button>
					<p className="text-xs text-muted-foreground">
						Se necesita al menos un participante para avanzar.
					</p>
				</div>
			</div>
		);
	}

	const hasWarning = warnings.length > 0 && !onAdvance;
	const forwardLabel = advanceLabel ?? `Continuar a ${ROOM_STAGE_LABELS[next]}`;
	const button = (
		<Button
			variant="default"
			disabled={pending || advanceDisabled}
			onClick={hasWarning ? undefined : handleAdvance}
		>
			{forwardLabel}
			<HugeiconsIcon
				icon={ArrowRight01Icon}
				strokeWidth={2}
				data-icon="inline-end"
				aria-hidden="true"
			/>
		</Button>
	);

	const help = STAGE_HELP[snapshot.roomStage];

	if (!hasWarning) {
		return (
			<div className={navClass}>
				{backButton}
				<Tooltip>
					<TooltipTrigger render={button} />
					<TooltipContent
						side="top"
						align="end"
						sideOffset={8}
						className="max-w-sm"
					>
						<div className="flex flex-col gap-1.5 text-left">
							<p className="font-medium">
								Estás en {ROOM_STAGE_LABELS[snapshot.roomStage]}
							</p>
							<p className="text-background/80">{help.description}</p>
							{help.nextCondition && (
								<p className="mt-0.5 border-t border-background/20 pt-1.5 text-background/80">
									<span className="font-medium">
										Para ir a {ROOM_STAGE_LABELS[next]}:
									</span>{" "}
									{help.nextCondition}
								</p>
							)}
						</div>
					</TooltipContent>
				</Tooltip>
			</div>
		);
	}

	return (
		<div className={navClass}>
			{backButton}
			<Dialog>
				<DialogTrigger render={button} />
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Ir a {ROOM_STAGE_LABELS[next]} de todos modos
						</DialogTitle>
						<DialogDescription>Pendientes:</DialogDescription>
					</DialogHeader>
					<ul className="flex flex-col gap-1 py-2">
						{warnings.map((label) => (
							<li key={label} className="text-sm">
								{label}
							</li>
						))}
					</ul>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" size="sm" />}>
							Cancelar
						</DialogClose>
						<DialogClose
							render={
								<Button size="sm" disabled={pending} onClick={handleAdvance} />
							}
						>
							Avanzar de todos modos
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
