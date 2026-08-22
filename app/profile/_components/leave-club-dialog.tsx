"use client";

import { useState, useTransition } from "react";
import { InfoButton } from "@/components/info-button";
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
					<div className="flex items-center gap-1.5">
						<DialogTitle>¿Darte de baja?</DialogTitle>
						<InfoButton
							title="¿Qué pasa con mis datos?"
							description="Tus aportes (preguntas, notas, participación) quedan como memoria del club. No podrás iniciar sesión ni participar en futuras sesiones."
						/>
					</div>
					<DialogDescription>
						Acción permanente. Para confirmar, escribí{" "}
						<span className="font-semibold text-foreground">
							{CONFIRM_TEXT}
						</span>
						:
					</DialogDescription>
				</DialogHeader>

				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={CONFIRM_TEXT}
					autoFocus
					aria-label="Confirmar baja"
				/>

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
