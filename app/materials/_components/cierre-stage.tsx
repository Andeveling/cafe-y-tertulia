"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RatingPanel } from "@/app/materials/_components/rating-panel";
import type { RatingProgress } from "@/app/materials/_lib/rating";
import { closeSession } from "@/app/materials/_lib/room-actions";
import type { RoomCierreSnapshot } from "@/app/materials/_lib/room-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
	sessionId: string;
	/** Progreso del rating (RPC rating_progress) — null si falló la carga. */
	rating: RatingProgress | null;
	cierre: RoomCierreSnapshot;
	isModerator: boolean;
};

/**
 * Etapa Cierre de la Sala: votación del Rating del material (anónima y
 * modificable hasta cerrar), checklist de pendientes para el Moderador y
 * "Cerrar sesión" con confirmación.
 */
export function CierreStage({ sessionId, rating, cierre, isModerator }: Props) {
	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Cierre</CardTitle>
					<CardDescription>
						Fin de la tertulia. Califica el material y el Moderador cierra la
						sesión cuando no quede nada pendiente.
					</CardDescription>
				</CardHeader>
			</Card>

			{rating && <RatingPanel progress={rating} />}

			{isModerator && (
				<>
					<PendingChecklist
						ratingOpen={rating?.ratingOpen ?? false}
						openTrivia={cierre.openTrivia}
						openTakes={cierre.openTakes}
					/>
					<CloseSessionDialog sessionId={sessionId} />
				</>
			)}
		</div>
	);
}

// ─── Checklist de pendientes (solo Moderador) ───────────────

type PendingItem = {
	label: string;
	pending: boolean;
};

function PendingChecklist({
	ratingOpen,
	openTrivia,
	openTakes,
}: {
	ratingOpen: boolean;
	openTrivia: number;
	openTakes: number;
}) {
	const items: PendingItem[] = [
		{ label: "Rating del material abierto", pending: ratingOpen },
		{
			label:
				openTrivia > 0 ? `Trivia en curso (${openTrivia})` : "Trivia en curso",
			pending: openTrivia > 0,
		},
		{
			label: openTakes > 0 ? `Takes abiertos (${openTakes})` : "Takes abiertos",
			pending: openTakes > 0,
		},
	];
	const allClear = items.every((i) => !i.pending);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Pendientes</CardTitle>
				<CardDescription>
					{allClear
						? "Todo listo para cerrar la sesión."
						: "Revisa los pendientes antes de cerrar la sesión."}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-col gap-2">
					{items.map((item) => (
						<li
							key={item.label}
							className="flex items-center justify-between text-sm"
						>
							<span>{item.label}</span>
							<Badge variant={item.pending ? "outline" : "secondary"}>
								{item.pending ? "pendiente" : "✓"}
							</Badge>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}

// ─── Cerrar sesión con confirmación ─────────────────────────

function CloseSessionDialog({ sessionId }: { sessionId: string }) {
	const [pending, start] = useTransition();

	function handleClose() {
		start(async () => {
			const r = await closeSession(sessionId);
			if (!r.ok) toast.error(r.error);
		});
	}

	return (
		<div className="flex justify-end">
			<Dialog>
				<DialogTrigger render={<Button variant="destructive" size="sm" />}>
					Cerrar sesión
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>¿Cerrar la sesión?</DialogTitle>
						<DialogDescription>
							Se consolidan los datos de la tertulia y el rating se congela. La
							acción no se puede deshacer.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" size="sm" />}>
							Cancelar
						</DialogClose>
						<DialogClose
							render={
								<Button
									variant="destructive"
									size="sm"
									disabled={pending}
									onClick={handleClose}
								/>
							}
						>
							Cerrar sesión
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
