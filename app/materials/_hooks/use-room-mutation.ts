"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { applyRoomMutationResult } from "@/app/materials/_lib/room-sync";
import type { ActionResult } from "@/lib/server-action";

export { applyRoomMutationResult } from "@/app/materials/_lib/room-sync";

/**
 * Mutación de la Sala: corre la acción y refresca el RSC.
 * El realtime cubre al resto de dispositivos; este refresh cubre al que actúa
 * (mismo patrón que StagePanel en Debate).
 */
export function useRoomMutation() {
	const router = useRouter();
	const [pending, start] = useTransition();

	function run(fn: () => Promise<ActionResult>, onSuccess?: () => void) {
		start(async () => {
			const r = await fn();
			applyRoomMutationResult(r, {
				refresh: () => router.refresh(),
				onError: (error) => toast.error(error),
				onSuccess,
			});
		});
	}

	return { pending, run };
}
