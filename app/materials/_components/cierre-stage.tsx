"use client";

import { useRouter } from "next/navigation";
import { RatingPanel } from "@/app/materials/_components/rating-panel";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
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
	/** false cuando la sesión no tiene material: no hay votación. */
	hasMaterial: boolean;
};

/**
 * Etapa Cierre de la Sala: votación del Rating del material (anónima y
 * modificable hasta cerrar), checklist de pendientes para el Moderador y
 * "Cerrar sesión" con confirmación.
 */
export function CierreStage({
	sessionId,
	rating,
	cierre,
	isModerator,
	hasMaterial,
}: Props) {
	const router = useRouter();
	const ratingFailed = hasMaterial && !rating;
	const blocked =
		ratingFailed ||
		(hasMaterial && (rating?.ratingOpen ?? false)) ||
		cierre.openTrivia > 0 ||
		cierre.openTakes > 0;
	const blockReason = ratingFailed
		? "No se pudo cargar el rating. Reintenta antes de cerrar."
		: hasMaterial && rating?.ratingOpen
			? "Cierra la votación del rating antes de cerrar."
			: cierre.openTrivia > 0
				? "Cierra la trivia en curso antes de cerrar."
				: cierre.openTakes > 0
					? "Cierra los takes abiertos antes de cerrar."
					: null;

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle>Cierre</CardTitle>
					<CardDescription>
						Fin de la tertulia. Califica el material y el Moderador cierra la
						sesión cuando no quede nada pendiente.
					</CardDescription>
				</CardHeader>
			</Card>

			{!hasMaterial ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Sin material</CardTitle>
						<CardDescription>
							Esta tertulia no califica material: no hay votación y puedes
							cerrar cuando quieras.
						</CardDescription>
					</CardHeader>
				</Card>
			) : rating ? (
				<RatingPanel progress={rating} />
			) : (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Rating no disponible</CardTitle>
						<CardDescription>
							No se pudo cargar la votación. Reintenta para ver el estado real
							antes de cerrar.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							variant="outline"
							size="sm"
							onClick={() => router.refresh()}
						>
							Reintentar
						</Button>
					</CardContent>
				</Card>
			)}

			{!isModerator && (
				<p role="status" className="text-sm text-muted-foreground">
					Esperando al moderador para cerrar la sesión.
				</p>
			)}

			{isModerator && (
				<>
					<PendingChecklist
						ratingOpen={rating?.ratingOpen ?? false}
						ratingFailed={ratingFailed}
						showRating={hasMaterial}
						openTrivia={cierre.openTrivia}
						openTakes={cierre.openTakes}
					/>
					<CloseSessionDialog
						sessionId={sessionId}
						blocked={blocked}
						blockReason={blockReason}
					/>
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
	ratingFailed,
	showRating,
	openTrivia,
	openTakes,
}: {
	ratingOpen: boolean;
	ratingFailed: boolean;
	showRating: boolean;
	openTrivia: number;
	openTakes: number;
}) {
	const items: PendingItem[] = [
		...(showRating
			? [
					{
						label: ratingFailed
							? "Rating sin cargar (reintenta)"
							: "Rating del material abierto",
						pending: ratingFailed || ratingOpen,
					},
				]
			: []),
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

function CloseSessionDialog({
	sessionId,
	blocked,
	blockReason,
}: {
	sessionId: string;
	blocked: boolean;
	blockReason: string | null;
}) {
	const { pending, run } = useRoomMutation();

	function handleClose() {
		run(() => closeSession(sessionId));
	}

	return (
		<div className="flex flex-col items-end gap-1">
			{blockReason && (
				<p role="status" className="text-xs text-muted-foreground">
					{blockReason}
				</p>
			)}
			<Dialog>
				<DialogTrigger
					render={<Button variant="destructive" size="sm" disabled={blocked} />}
				>
					Cerrar sesión
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>¿Cerrar la sesión?</DialogTitle>
						<DialogDescription>
							Se consolidan los datos de la tertulia y el rating se congela.
							Después solo caben correcciones puntuales del moderador.
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
