"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { LobbySnapshot } from "@/app/materials/_lib/lobby";
import {
	joinLobby,
	leaveLobby,
	runDraw,
	setOptOut,
} from "@/app/materials/_lib/lobby-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ActionResult } from "@/lib/server-action";

type Props = {
	lobby: LobbySnapshot;
	userId: string;
	isModerator: boolean;
};

export function LobbyPanel({ lobby, userId, isModerator }: Props) {
	const [pending, start] = useTransition();
	const me = lobby.participants.find((p) => p.memberId === userId);
	const freeTalkers = [
		...lobby.participants.filter((p) => p.optOut).map((p) => p.displayName),
		...lobby.unassignedNames,
	];

	function act(fn: () => Promise<ActionResult>) {
		start(async () => {
			const r = await fn();
			if (!r.ok) toast.error(r.error);
		});
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Presentes</CardTitle>
					<CardDescription>
						Confirma tu asistencia. Marca “Sin sorteo” si solo conversas.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{lobby.participants.length === 0 ? (
						<p className="text-sm text-muted-foreground">Nadie aún.</p>
					) : (
						<ul className="flex flex-col gap-2">
							{lobby.participants.map((p) => (
								<li
									key={p.memberId}
									className="flex items-center justify-between gap-2 text-sm"
								>
									<span>
										{p.displayName}
										{p.memberId === lobby.moderatorId ? " · Moderador" : ""}
									</span>
									{p.optOut ? (
										<Badge variant="outline">Sin sorteo</Badge>
									) : (
										<Badge variant="secondary">En sorteo</Badge>
									)}
								</li>
							))}
						</ul>
					)}

					<div className="flex flex-wrap gap-2 pt-2">
						{!me ? (
							<Button
								size="sm"
								disabled={pending || lobby.drawDone}
								onClick={() => act(() => joinLobby(lobby.sessionId))}
							>
								Estoy presente
							</Button>
						) : (
							<>
								<Button
									size="sm"
									variant="outline"
									disabled={pending || lobby.drawDone}
									onClick={() =>
										act(() => setOptOut(lobby.sessionId, !me.optOut))
									}
								>
									{me.optOut ? "Entrar al sorteo" : "Sin sorteo"}
								</Button>
								<Button
									size="sm"
									variant="ghost"
									disabled={pending || lobby.drawDone}
									onClick={() => act(() => leaveLobby(lobby.sessionId))}
								>
									Salir
								</Button>
							</>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Sorteo</CardTitle>
					<CardDescription>
						Una sola vez. Queda oculto hasta revelar en el debate.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					{lobby.drawDone ? (
						<>
							<p className="text-sm">
								Sorteo listo · oculto. Nadie ve las asignaciones todavía.
							</p>
							{freeTalkers.length > 0 && (
								<p className="text-xs text-muted-foreground">
									Sin asignación / libre: {freeTalkers.join(", ")}
								</p>
							)}
						</>
					) : isModerator ? (
						<>
							<p className="text-sm text-muted-foreground">
								{lobby.eligibleCount} en sorteo
								{lobby.optOutCount > 0
									? ` · ${lobby.optOutCount} sin sorteo`
									: ""}
							</p>
							<Button
								disabled={pending || lobby.eligibleCount === 0}
								onClick={() => act(() => runDraw(lobby.sessionId))}
							>
								Ejecutar sorteo
							</Button>
						</>
					) : (
						<p className="text-sm text-muted-foreground">
							Espera a que el moderador ejecute el sorteo.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
