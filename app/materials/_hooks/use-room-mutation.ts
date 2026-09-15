"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
	createSalaSync,
	type RoomFormAction,
} from "@/app/materials/_lib/room-sync";
import type { ActionResult } from "@/lib/server-action";

/**
 * Adapter de mutación de la Sala: un solo camino (`createSalaSync.mutate`).
 * Éxito → refresh del actor; error → toast y sin refresh. FormData es
 * detalle interno cuando el caller pasa acción + campos.
 */
export function useRoomMutation() {
	const router = useRouter();
	const [pending, start] = useTransition();

	function run(fn: () => Promise<ActionResult>, onSuccess?: () => void): void;
	function run(
		action: RoomFormAction,
		fields: Record<string, string>,
		onSuccess?: () => void,
	): void;
	function run(
		work: (() => Promise<ActionResult>) | RoomFormAction,
		fieldsOrOnSuccess?: Record<string, string> | (() => void),
		onSuccess?: () => void,
	) {
		start(async () => {
			const sync = createSalaSync({
				refresh: () => router.refresh(),
				onError: (error) => toast.error(error),
			});
			if (typeof fieldsOrOnSuccess === "object") {
				await sync.mutate(
					{ action: work as RoomFormAction, fields: fieldsOrOnSuccess },
					onSuccess,
				);
			} else {
				await sync.mutate(
					work as () => Promise<ActionResult>,
					fieldsOrOnSuccess,
				);
			}
		});
	}

	return { pending, run };
}
