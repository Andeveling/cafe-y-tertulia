"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * El pozo del club ya es `<main>`. Este fallback no aporta otro landmark.
 */
export default function GroupMaterialsError({
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
		<div className="mx-auto flex w-full max-w-lg flex-col items-start gap-4">
			<h1 className="font-heading text-2xl font-semibold">
				No se pudo mostrar la estantería
			</h1>
			<p className="text-sm text-muted-foreground">
				Los materiales siguen en el grupo. Reintenta, o vuelve y ábrela de
				nuevo.
			</p>
			<div className="flex flex-wrap gap-2">
				<Button className="min-h-11" onClick={() => reset()}>
					Reintentar
				</Button>
				<Button
					variant="outline"
					className="min-h-11"
					render={<Link href="/g" />}
				>
					Volver a mis grupos
				</Button>
			</div>
		</div>
	);
}
