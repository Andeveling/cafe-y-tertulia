"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { announceMemberLeft } from "@/app/materials/_hooks/use-room-realtime";
import { leaveSession } from "@/app/materials/_lib/room-actions";
import {
	clearLeftRoom,
	markLeftRoom,
} from "@/app/materials/_lib/room-seat-gate";
import { Button } from "@/components/ui/button";
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

/**
 * Salir de la sesión desde la propia card: borra tus preguntas y tu
 * asiento, avisa a la Sala y te lleva a Inicio.
 *
 * No pasa por `useRoomMutation`: su refresh recargaría /room todavía
 * montada y `seatIfAbsent` te volvería a sentar.
 */
export function LeaveSessionButton({ sessionId }: { sessionId: string }) {
	const router = useRouter();
	const [pending, setPending] = useState(false);

	async function handleLeave() {
		if (pending) return;
		setPending(true);
		// Antes del delete: el refresh que dispara el propio DELETE no
		// debe volver a sentar.
		markLeftRoom(sessionId);
		const result = await leaveSession(sessionId);
		if (!result.ok) {
			clearLeftRoom();
			toast.error(result.error);
			setPending(false);
			return;
		}
		await announceMemberLeft(sessionId);
		toast.success("Saliste de la sesión");
		router.push("/");
	}

	return (
		<Dialog>
			<DialogTrigger
				render={
					<Button
						variant="ghost"
						size="xs"
						disabled={pending}
						className="text-destructive hover:bg-destructive/10 hover:text-destructive"
					/>
				}
			>
				Salir
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>¿Salir de la sesión?</DialogTitle>
					<DialogDescription>
						Se borran tus preguntas enviadas y dejas tu asiento. Puedes volver a
						entrar cuando quieras.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose
						render={<Button variant="outline" size="sm" disabled={pending} />}
					>
						Cancelar
					</DialogClose>
					<Button
						variant="destructive"
						size="sm"
						disabled={pending}
						onClick={handleLeave}
					>
						Salir de la sesión
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
