"use client";

import { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { leaveClub } from "../_lib/profile-actions";

const CONFIRM_TEXT = "darme de baja";

export function LeaveClubDialog() {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState("");
	const [isPending, startTransition] = useTransition();

	const matches = input.trim().toLowerCase() === CONFIRM_TEXT;

	function handleConfirm() {
		startTransition(async () => {
			await leaveClub();
		});
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (!v) setInput("");
			}}
		>
			<DialogTrigger render={<Button variant="destructive" />}>
				Darme de baja
			</DialogTrigger>
			<DialogContent showCloseButton>
				<DialogHeader>
					<DialogTitle>¿Darte de baja del club?</DialogTitle>
					<DialogDescription>
						Esta acción es permanente. Tus aportes (preguntas, notas,
						participación) quedan como memoria del club, pero no podrás iniciar
						sesión ni participar en futuras sesiones.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-3">
					<p className="text-sm text-muted-foreground">
						Para confirmar, escribí{" "}
						<span className="font-semibold text-foreground">
							{CONFIRM_TEXT}
						</span>{" "}
						abajo:
					</p>
					<Input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder={CONFIRM_TEXT}
						autoFocus
						aria-label="Confirmar baja"
					/>
				</div>

				<DialogFooter>
					<DialogClose
						render={<Button variant="outline" disabled={isPending} />}
					>
						Cancelar
					</DialogClose>
					<Button
						variant="destructive"
						disabled={!matches || isPending}
						onClick={handleConfirm}
					>
						{isPending ? "Dando de baja…" : "Confirmar baja"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
