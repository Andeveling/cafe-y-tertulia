"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/server-action";

/** Acción de servidor que recibe un ActionResult dummy y un FormData. */
export type ServerActionFn = (
	prev: ActionResult,
	formData: FormData,
) => Promise<ActionResult>;

const OK_RESULT: ActionResult = { ok: true };

/**
 * Ejecuta una acción de servidor con campos sueltos: arma el FormData,
 * muestra el error vía toast si falla y refresca la ruta al terminar.
 * Forma compartida por los paneles que disparan acciones sin formulario.
 */
export function useRunAction() {
	const router = useRouter();
	const [pending, start] = useTransition();

	function run(action: ServerActionFn, fields: Record<string, string>) {
		start(async () => {
			const formData = new FormData();
			for (const [key, value] of Object.entries(fields)) {
				formData.set(key, value);
			}
			const result = await action(OK_RESULT, formData);
			if (!result.ok) toast.error(result.error);
			router.refresh();
		});
	}

	return { pending, run };
}
