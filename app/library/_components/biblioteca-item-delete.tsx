"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteBibliotecaAction } from "@/app/materials/_lib/biblioteca-actions";
import { Button } from "@/components/ui/button";

/** Borra un item propio de la Biblioteca (el snapshot postulado sobrevive). */
export function BibliotecaItemDelete({ id }: { id: string }) {
	const [isPending, startTransition] = useTransition();

	function onDelete() {
		startTransition(async () => {
			const result = await deleteBibliotecaAction(id);
			if ("error" in result) {
				toast.error(result.error);
			} else {
				toast.success("Candidato borrado");
			}
		});
	}

	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			disabled={isPending}
			onClick={onDelete}
		>
			Borrar
		</Button>
	);
}
