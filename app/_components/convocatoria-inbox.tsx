"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { responderConvocatoriaAction } from "@/app/materials/_lib/convocatoria-actions";
import { isSalaPath } from "@/lib/sala-path";
import { createClient } from "@/lib/supabase/client";

export function ConvocatoriaInbox({ userId }: { userId: string }) {
	const router = useRouter();

	useEffect(() => {
		const supabase = createClient();
		const channel = supabase
			.channel("convocatorias-inbox")
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "convocatorias",
					filter: `to_id=eq.${userId}`,
				},
				(payload) => {
					const row = payload.new as {
						id: string;
						session_id: string;
						status: string;
					};
					if (row.status !== "pending") return;
					// Dentro de la Sala no se interrumpe el Escenario: la invitación
					// queda en la base y se ve al salir.
					if (isSalaPath(window.location.pathname)) return;
					toast("Te convocan a una Sala", {
						id: row.id,
						duration: Number.POSITIVE_INFINITY,
						action: {
							label: "Unirse",
							onClick: () => {
								void (async () => {
									const result = await responderConvocatoriaAction(
										row.id,
										true,
									);
									if ("sessionId" in result && result.sessionId) {
										router.push(`/materials/sessions/${result.sessionId}/room`);
									}
								})();
							},
						},
						cancel: {
							label: "Ahora no",
							onClick: () => {
								void responderConvocatoriaAction(row.id, false);
							},
						},
					});
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [userId, router]);

	return null;
}
