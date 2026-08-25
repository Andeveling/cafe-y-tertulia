import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type Props = {
	materialId: string;
	status: "closed" | "archived";
};

/**
 * Vista terminal de la Sala: la Sesión ya se cerró (cerrada/histórico) y sus
 * datos quedaron consolidados. Redirige la lectura al resumen del material.
 */
export function RoomClosedView({ materialId, status }: Props) {
	return (
		<main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
			<div className="flex flex-wrap gap-2">
				<Badge variant="outline">Sala</Badge>
				<Badge variant="secondary">
					{status === "closed" ? "Cerrada" : "Histórico"}
				</Badge>
			</div>
			<h1 className="font-heading text-2xl font-semibold">Sesión finalizada</h1>
			<p className="text-sm text-muted-foreground">
				Los datos quedaron consolidados. Encuentra el resumen en el material.
			</p>
			<Link
				href={`/materials/${materialId}`}
				className="text-sm underline underline-offset-4"
			>
				Ir al material →
			</Link>
		</main>
	);
}
