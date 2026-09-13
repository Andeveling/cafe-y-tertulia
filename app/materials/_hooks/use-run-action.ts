"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
	applyRoomMutationResult,
	ROOM_OK_RESULT,
	roomFormData,
} from "@/app/materials/_lib/room-sync";
import type { ActionResult } from "@/lib/server-action";

/** Acción de servidor que recibe un ActionResult dummy y un FormData. */
export type ServerActionFn = (
	prev: ActionResult,
	formData: FormData,
) => Promise<ActionResult>;

/**
 * Ejecuta una acción de servidor con campos sueltos: arma el FormData,
 * muestra el error vía toast si falla y refresca la ruta al terminar.
 * Forma compartida por los paneles que disparan acciones sin formulario.
 *
 * Mismo camino que `useRoomMutation`: ambos resuelven por
 * `applyRoomMutationResult` en `room-sync` (éxito → refresh del actor,
 * error → toast sin refresh). Este hook solo añade el armado del FormData;
 * la bandeja de Debate ya usa `useRoomMutation` directo.
 */
export function useRunAction() {
	const router = useRouter();
	const [pending, start] = useTransition();

	function run(action: ServerActionFn, fields: Record<string, string>) {
		start(async () => {
			const result = await action(ROOM_OK_RESULT, roomFormData(fields));
			applyRoomMutationResult(result, {
				refresh: () => router.refresh(),
				onError: (error) => toast.error(error),
			});
		});
	}

	return { pending, run };
}
