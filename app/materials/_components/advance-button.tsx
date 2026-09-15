"use client";

import {
	ArchiveIcon,
	ArrowRight01Icon,
	CircleLock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTransition } from "react";
import { toast } from "sonner";
import type { SessionStatus } from "@/app/materials/_lib/materials";
import {
	advanceMaterial,
	advanceSession,
	closeSessionAction,
} from "@/app/materials/_lib/materials-actions";
import { SESSION_LIFECYCLE_LABELS } from "@/app/materials/_lib/session-lifecycle";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/server-action";

type Props =
	| { kind: "material"; id: string }
	| {
			kind: "session";
			id: string;
			materialId: string | null;
			status: SessionStatus;
	  };

/** Una acción por estado de Sesión: qué hace, cómo se ve y qué confirma. */
type SessionAction = {
	label: string;
	icon: typeof CircleLock01Icon | typeof ArchiveIcon | typeof ArrowRight01Icon;
	success: string;
	run: (input: {
		sessionId: string;
		materialId: string | null;
	}) => Promise<ActionResult>;
};

// Base para avanzar en el flujo (preparation/lobby → mismo RPC, distinta etiqueta).
const BASE_ADVANCE: Omit<SessionAction, "label"> = {
	icon: ArrowRight01Icon,
	success: "Sesión avanzada",
	run: advanceSession,
};

const SESSION_ACTIONS: Record<
	Exclude<SessionStatus, "archived" | "lobby">,
	SessionAction
> = {
	preparation: {
		label: SESSION_LIFECYCLE_LABELS.preparation,
		...BASE_ADVANCE,
	},
	in_progress: {
		label: SESSION_LIFECYCLE_LABELS.in_progress,
		icon: CircleLock01Icon,
		success: "Sesión cerrada",
		run: closeSessionAction,
	},
	closed: {
		label: SESSION_LIFECYCLE_LABELS.closed,
		icon: ArchiveIcon,
		success: "Sesión archivada",
		run: advanceSession,
	},
};

export function AdvanceButton(props: Props) {
	const [isPending, startTransition] = useTransition();

	if (props.kind === "material") {
		return (
			<Button
				variant="outline"
				size="sm"
				disabled={isPending}
				onClick={() =>
					startTransition(async () => {
						const result = await advanceMaterial(props.id);
						if ("error" in result) {
							toast.error(result.error);
						} else {
							toast.success("Material avanzado en el pipeline");
						}
					})
				}
			>
				<HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-start" />
				Avanzar estado
			</Button>
		);
	}

	// Histórico es solo lectura: el botón no existe ahí. El salto
	// lobby → in_progress tampoco existe: la Sala es dueña de ese avance
	// (etapa Sorteo → Debate vía `advance_room_stage`, solo Moderador). Un
	// salto directo dejaría room_stage desincronizado (p. ej.
	// in_progress/questions).
	if (props.status === "archived" || props.status === "lobby") return null;
	const action = SESSION_ACTIONS[props.status];

	return (
		<Button
			variant="outline"
			size="sm"
			disabled={isPending}
			onClick={() =>
				startTransition(async () => {
					const result = await action.run({
						sessionId: props.id,
						materialId: props.materialId,
					});
					if ("error" in result) {
						toast.error(result.error);
					} else {
						toast.success(action.success);
					}
				})
			}
		>
			<HugeiconsIcon icon={action.icon} data-icon="inline-start" />
			{action.label}
		</Button>
	);
}
