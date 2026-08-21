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

type Props =
	| { kind: "material"; id: string }
	| { kind: "session"; id: string; materialId: string; status: SessionStatus };

const SESSION_ACTION_LABELS: Partial<Record<SessionStatus, string>> = {
	preparation: "Avanzar",
	lobby: "Iniciar sesión",
	in_progress: "Cerrar sesión",
	closed: "Archivar",
};

export function AdvanceButton(props: Props) {
	const [isPending, startTransition] = useTransition();

	const isMaterial = props.kind === "material";
	const status = props.kind === "session" ? props.status : null;
	const id = props.id;
	const materialId = props.kind === "session" ? props.materialId : null;

	const label = isMaterial
		? "Avanzar estado"
		: (SESSION_ACTION_LABELS[status ?? "lobby"] ?? "Avanzar sesión");

	const icon =
		status === "in_progress"
			? CircleLock01Icon
			: status === "closed"
				? ArchiveIcon
				: ArrowRight01Icon;

	return (
		<Button
			variant="outline"
			size="sm"
			disabled={isPending}
			onClick={() =>
				startTransition(async () => {
					const result = isMaterial
						? await advanceMaterial(id)
						: status === "in_progress"
							? await closeSessionAction({
									sessionId: id,
									materialId: materialId!,
								})
							: await advanceSession({
									sessionId: id,
									materialId: materialId!,
								});

					if ("error" in result) {
						toast.error(result.error);
					} else {
						toast.success(
							isMaterial
								? "Material avanzado en el pipeline"
								: status === "in_progress"
									? "Sesión cerrada"
									: status === "closed"
										? "Sesión archivada"
										: "Sesión avanzada",
						);
					}
				})
			}
		>
			<HugeiconsIcon icon={icon} data-icon="inline-start" />
			{label}
		</Button>
	);
}
