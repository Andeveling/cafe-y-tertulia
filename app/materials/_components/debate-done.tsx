"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Enter } from "@/app/materials/_components/stage-enter";
import { ModeratorZone } from "@/app/materials/_components/stage-moderation";
import { useRoomMutation } from "@/app/materials/_hooks/use-room-mutation";
import { advanceRoomStage } from "@/app/materials/_lib/room-actions";
import {
	ROOM_STAGE_LABELS,
	type RoomStage,
} from "@/app/materials/_lib/room-types";
import { Button } from "@/components/ui/button";

export function DebateDone({
	sessionId,
	isModerator,
	next,
	empty,
	warnings,
}: {
	sessionId: string;
	isModerator: boolean;
	next: RoomStage | null;
	empty: boolean;
	warnings: string[];
}) {
	const { pending, run } = useRoomMutation();

	function handleAdvance() {
		if (!next || empty) return;
		run(() => advanceRoomStage(sessionId, next));
	}

	return (
		<Enter>
			<div
				className="flex flex-col items-start gap-4 py-8 text-left"
				role="status"
				aria-live="polite"
			>
				<p className="font-heading text-2xl font-medium lg:text-3xl">
					Debate terminado
				</p>
				<p className="max-w-md text-sm text-muted-foreground">
					{isModerator
						? "Todos los turnos se completaron. En Cierre se califica el material y se cierra la sesión: ahí se actualizan conteos e insignias."
						: "Todos los turnos se completaron. Los conteos e insignias se actualizan cuando el moderador cierra la sesión en Cierre."}
				</p>
				{isModerator && next && (
					<ModeratorZone>
						<Button disabled={pending || empty} onClick={handleAdvance}>
							Continuar a {ROOM_STAGE_LABELS[next]}
							<HugeiconsIcon
								icon={ArrowRight01Icon}
								strokeWidth={2}
								data-icon="inline-end"
								aria-hidden="true"
							/>
						</Button>
						{empty && (
							<p className="text-xs text-muted-foreground">
								Se necesita al menos un participante para avanzar.
							</p>
						)}
						{warnings.length > 0 && (
							<ul className="flex flex-col gap-1">
								{warnings.map((label) => (
									<li key={label} className="text-sm text-muted-foreground">
										{label}
									</li>
								))}
							</ul>
						)}
					</ModeratorZone>
				)}
			</div>
		</Enter>
	);
}
