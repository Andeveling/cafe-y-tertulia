"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
	nominateBibliotecaAction,
	withdrawPostulacionAction,
} from "@/app/materials/_lib/postulacion-actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/server-action";

function notifyActionResult(result: ActionResult, successMessage: string) {
	if ("error" in result) {
		toast.error(result.error);
	} else {
		toast.success(successMessage);
	}
}

/** Postula un item propio de la Biblioteca hacia el Grupo activo (#88). */
export function PostularButton({
	libraryItemId,
	groupId,
	slug,
	disabled,
	disabledReason,
}: {
	libraryItemId: string;
	groupId: string;
	slug: string;
	disabled?: boolean;
	disabledReason?: string;
}) {
	const [isPending, startTransition] = useTransition();

	function onNominate() {
		startTransition(async () => {
			const result = await nominateBibliotecaAction({
				libraryItemId,
				groupId,
				slug,
			});
			notifyActionResult(result, "Postulado hacia el grupo");
		});
	}

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			disabled={disabled || isPending}
			title={disabledReason}
			onClick={onNominate}
		>
			Postular
		</Button>
	);
}

/** Retira una postulación activa propia antes del bloqueo (#88). */
export function RetirarPostulacionButton({
	nominationId,
	slug,
}: {
	nominationId: string;
	slug: string;
}) {
	const [isPending, startTransition] = useTransition();

	function onWithdraw() {
		startTransition(async () => {
			const result = await withdrawPostulacionAction({
				nominationId,
				slug,
			});
			notifyActionResult(result, "Postulación retirada");
		});
	}

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			disabled={isPending}
			onClick={onWithdraw}
		>
			Retirar
		</Button>
	);
}
