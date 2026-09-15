"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * La Sala vive de refreshes realtime: si un fetch falla en mitad de una
 * ráfaga (p. ej. el Sorteo), se cae solo este segmento — con Reintentar —
 * en vez de la página entera.
 */
export default function RoomError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="mx-auto flex w-full max-w-lg flex-col items-start gap-4 p-6">
			<h1 className="font-heading text-2xl font-semibold">
				La Sala se desincronizó
			</h1>
			<p className="text-sm text-muted-foreground">
				Un refresco en vivo falló. Tus preguntas y tu lugar siguen a salvo:
				reintenta para volver a la etapa actual.
			</p>
			<div className="flex gap-2">
				<Button onClick={() => reset()}>Reintentar</Button>
				<Button variant="outline" render={<Link href="/" />}>
					Volver al club
				</Button>
			</div>
		</main>
	);
}
