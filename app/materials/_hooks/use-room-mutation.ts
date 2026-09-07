"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/server-action";

/**
 * Mutación de la Sala: corre la acción y refresca el RSC.
 * El realtime cubre al resto de dispositivos; este refresh cubre al que actúa
 * (mismo patrón que StagePanel en Debate).
 */
export function useRoomMutation() {
	const router = useRouter();
	const [pending, start] = useTransition();

	function run(fn: () => Promise<ActionResult>) {
		start(async () => {
			const r = await fn();
			if (!r.ok) toast.error(r.error);
			else router.refresh();
		});
	}

	return { pending, run };
}
