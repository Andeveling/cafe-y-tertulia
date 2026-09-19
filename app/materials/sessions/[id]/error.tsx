"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { isSalaPath } from "@/lib/sala-path";
import { cn } from "@/lib/utils";

/**
 * Cubre Sala (`/room`, sin chrome) e Histórico (pozo del club con `<main>`).
 * Solo la Sala aporta el landmark; en el club el pozo ya es `<main>`.
 */
export default function SessionError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const sala = isSalaPath(usePathname());
	const Root = sala ? "main" : "div";

	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<Root
			className={cn(
				"mx-auto flex w-full max-w-lg flex-col items-start gap-4",
				sala && "p-6",
			)}
		>
			<h1 className="font-heading text-2xl font-semibold">
				{sala ? "La Sala se desincronizó" : "No se pudo mostrar esta sesión"}
			</h1>
			<p className="text-sm text-muted-foreground">
				{sala
					? "Un refresco en vivo falló. Tus preguntas y tu lugar siguen a salvo: reintenta para volver a la etapa actual."
					: "El registro sigue en el club. Reintenta, o vuelve y ábrelo de nuevo."}
			</p>
			<div className="flex flex-wrap gap-2">
				<Button onClick={() => reset()}>Reintentar</Button>
				<Button variant="outline" render={<Link href="/" />}>
					Volver al club
				</Button>
			</div>
		</Root>
	);
}
