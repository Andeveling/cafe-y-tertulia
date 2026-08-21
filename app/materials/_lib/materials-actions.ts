"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionResult, runServerAction } from "@/lib/server-action";
import type { MaterialKind, SessionStatus } from "./materials";

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
	materialId: string;
	range: string;
}): Promise<ActionResult> {
	return runServerAction({
		run: async ({ supabase }) => {
			const { error } = await supabase.from("sessions").insert({
				material_id: input.materialId,
				range: input.range.trim(),
			});

			if (error) {
				return {
					ok: false,
					error: `No se pudo crear la sesión: ${error.message}`,
				};
			}
		},
		revalidate: async () => [`/materials/${input.materialId}`],
	});
}

/**
 * Avanza exactamente un estado: preparación → lobby → en curso → cerrada → histórico.
 * La transición también está protegida por el trigger de la base de datos.
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

			const nextStatus = (
				{
					preparation: "lobby",
					lobby: "in_progress",
					in_progress: "closed",
					closed: "archived",
					archived: null,
				} as const
			)[data.status] as SessionStatus | null;

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
