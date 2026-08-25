"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionResult, runServerAction } from "@/lib/server-action";
import type { MaterialKind, SessionStatus } from "./constants";
import { SESSION_NEXT_STATUS } from "./constants";

export async function createMaterial(input: {
	title: string;
	kind: MaterialKind;
	author: string;
}): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			const { error } = await supabase.from("materials").insert({
				title: input.title.trim(),
				kind: input.kind,
				author: input.author.trim(),
				created_by: user!.id,
			});

			if (error) {
				return {
					ok: false,
					error: `No se pudo crear el material: ${error.message}`,
				};
			}

			revalidatePath("/materials");
			redirect("/materials");
		},
	});
}

/**
 * Avanza el pipeline en un solo sentido: propuesto → seleccionado → en curso → terminado.
 * Lo decide el club/moderador; el RLS y esta acción garantizan que solo un Miembro activo lo hace.
 */
export async function advanceMaterial(id: string): Promise<ActionResult> {
	return runServerAction({
		run: async ({ supabase }) => {
			const { data, error } = await supabase
				.from("materials")
				.select("status")
				.eq("id", id)
				.single();

			if (error || !data) {
				return { ok: false, error: "No se encontró el material para avanzar." };
			}

			const order = [
				"proposed",
				"selected",
				"in_progress",
				"finished",
			] as const;
			const currentIndex = order.indexOf(data.status);
			const nextStatus = order[currentIndex + 1];

			if (!nextStatus) return;

			const { error: updateError } = await supabase
				.from("materials")
				.update({ status: nextStatus })
				.eq("id", id);

			if (updateError) {
				return {
					ok: false,
					error: `No se pudo avanzar el material: ${updateError.message}`,
				};
			}
		},
		revalidate: async () => ["/materials", `/materials/${id}`],
	});
}

export async function createSession(input: {
	materialId?: string | null;
	range?: string | null;
	scheduledAt?: string | null;
	material?: { title: string; kind: MaterialKind; author: string };
}): Promise<ActionResult | { ok: true; sessionId: string }> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			let materialId = input.materialId ?? null;
			if (input.material) {
				const { data, error } = await supabase
					.from("materials")
					.insert({
						title: input.material.title.trim(),
						kind: input.material.kind,
						author: input.material.author.trim(),
						created_by: user!.id,
					})
					.select("id")
					.single();
				if (error || !data) {
					return {
						ok: false,
						error: `No se pudo crear el material: ${error?.message ?? ""}`,
					};
				}
				materialId = data.id;
			}

			const { data: sessionId, error } = await supabase.rpc("create_session", {
				p_material_id: materialId ?? undefined,
				p_range: input.range?.trim() || undefined,
				p_scheduled_at: input.scheduledAt ?? undefined,
			});

			if (error || !sessionId) {
				return {
					ok: false,
					error: `No se pudo crear la sesión: ${error?.message ?? ""}`,
				};
			}

			revalidatePath("/");
			if (materialId) revalidatePath(`/materials/${materialId}`);
			return { ok: true, sessionId };
		},
	}) as Promise<ActionResult | { ok: true; sessionId: string }>;
}

/** Actualiza la fecha programada de una sesión (o la limpia si es null). */
export async function rescheduleSession(input: {
	materialId: string;
	sessionId: string;
	scheduledAt: string | null;
}): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase
				.from("sessions")
				.update({ scheduled_at: input.scheduledAt })
				.eq("id", input.sessionId);

			if (error) {
				return {
					ok: false,
					error: `No se pudo reprogramar la sesión: ${error.message}`,
				};
			}
		},
		revalidate: async () => [`/materials/${input.materialId}`],
	});
}

/**
 * Avanza exactamente un estado: preparación → lobby → en curso → histórico.
 * El cierre `en_curso → cerrada` NO pasa por aquí: usa `closeSessionAction`,
 * que consolida (rating, minijuegos) vía el RPC atómico `close_session`.
 * La transición también está protegida por los triggers de la base de datos.
 */
export async function advanceSession(input: {
	materialId: string;
	sessionId: string;
}): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase, user }) => {
			const { data, error } = await supabase
				.from("sessions")
				.select("status, moderator_id")
				.eq("id", input.sessionId)
				.single();

			if (error || !data) {
				return { ok: false, error: "No se encontró la sesión para avanzar." };
			}

			// El cierre `en_curso → cerrada` pasa por `closeSessionAction` (consolida).
			if (data.status === "in_progress") {
				return { ok: false, error: "Para cerrar la sesión usa Cerrar sesión." };
			}

			// Archivado manual solo por el moderador (SPEC §3.1, AC5).
			if (data.status === "closed" && data.moderator_id !== user?.id) {
				return {
					ok: false,
					error: "Solo el moderador puede archivar la sesión.",
				};
			}

			const nextStatus = SESSION_NEXT_STATUS[data.status];

			if (!nextStatus) return;

			const patch: {
				status: SessionStatus;
				moderator_id?: string;
			} = { status: nextStatus };
			if (data.status === "preparation" && user) {
				patch.moderator_id = user.id;
			}

			const { error: updateError } = await supabase
				.from("sessions")
				.update(patch)
				.eq("id", input.sessionId);

			if (updateError) {
				return {
					ok: false,
					error: `No se pudo avanzar la sesión: ${updateError.message}`,
				};
			}
		},
		revalidate: async () => [`/materials/${input.materialId}`],
	});
}

/**
 * Cierre atómico `en_curso → cerrada` vía el RPC `close_session`: consolida
 * participantes, minijuegos y rating (congela promedio + conteo y descarta los
 * votos individuales, ADR 0003). Solo el moderador; falla si queda una trivia,
 * una votación o el Sorteo sin terminar.
 */
export async function closeSessionAction(input: {
	materialId: string;
	sessionId: string;
}): Promise<ActionResult> {
	return runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { error } = await supabase.rpc("close_session", {
				target_session_id: input.sessionId,
			});
			if (error) {
				return { ok: false, error: error.message };
			}
		},
		revalidate: async () => [
			`/materials/${input.materialId}`,
			`/materials/sessions/${input.sessionId}/stage`,
			`/materials/sessions/${input.sessionId}/rating`,
			`/materials/sessions/${input.sessionId}`,
			"/materials",
		],
	});
}
