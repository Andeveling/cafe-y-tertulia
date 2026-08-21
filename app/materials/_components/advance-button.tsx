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
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/server-action";

type Props =
	| { kind: "material"; id: string }
	| { kind: "session"; id: string; materialId: string; status: SessionStatus };

/** Una acción por estado de Sesión: qué hace, cómo se ve y qué confirma. */
const SESSION_ACTIONS: Record<
	Exclude<SessionStatus, "archived">,
	{
		label: string;
		icon:
			| typeof CircleLock01Icon
			| typeof ArchiveIcon
			| typeof ArrowRight01Icon;
		success: string;
		run: (input: {
			sessionId: string;
			materialId: string;
		}) => Promise<ActionResult>;
	}
> = {
	preparation: {
		label: "Avanzar",
		icon: ArrowRight01Icon,
		success: "Sesión avanzada",
		run: advanceSession,
	},
	lobby: {
		label: "Iniciar sesión",
		icon: ArrowRight01Icon,
		success: "Sesión avanzada",
		run: advanceSession,
	},
	in_progress: {
		label: "Cerrar sesión",
		icon: CircleLock01Icon,
		success: "Sesión cerrada",
		run: closeSessionAction,
	},
	closed: {
		label: "Archivar",
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

	// Histórico es solo lectura: el botón no existe ahí.
	if (props.status === "archived") return null;
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
