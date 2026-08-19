"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MaterialKind } from "@/lib/materials";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { success: true };

export async function createMaterial(input: {
	title: string;
	kind: MaterialKind;
	author: string;
}): Promise<ActionResult> {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	const { error } = await supabase.from("materials").insert({
		title: input.title.trim(),
		kind: input.kind,
		author: input.author.trim(),
		created_by: user.id,
	});

	if (error) {
		return { error: `No se pudo crear el material: ${error.message}` };
	}

	revalidatePath("/materiales");
	redirect("/materiales");
}

/**
 * Avanza el pipeline en un solo sentido: propuesto → seleccionado → en curso → terminado.
 * Lo decide el club/moderador; el RLS y esta acción garantizan que solo un Miembro activo lo hace.
 */
export async function advanceMaterial(id: string): Promise<ActionResult> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("materials")
		.select("status")
		.eq("id", id)
		.single();

	if (error || !data) {
		return { error: "No se encontró el material para avanzar." };
	}

	const order = ["proposed", "selected", "in_progress", "finished"] as const;
	const currentIndex = order.indexOf(data.status);
	const nextStatus = order[currentIndex + 1];

	if (!nextStatus) {
		return { success: true };
	}

	const { error: updateError } = await supabase
		.from("materials")
		.update({ status: nextStatus })
		.eq("id", id);

	if (updateError) {
		return {
			error: `No se pudo avanzar el material: ${updateError.message}`,
		};
	}

	revalidatePath("/materiales");
	revalidatePath(`/materiales/${id}`);
	return { success: true };
}

export async function createSession(input: {
	materialId: string;
	range: string;
}): Promise<ActionResult> {
	const supabase = await createClient();

	const { error } = await supabase.from("sessions").insert({
		material_id: input.materialId,
		range: input.range.trim(),
	});

	if (error) {
		return { error: `No se pudo crear la sesión: ${error.message}` };
	}

	revalidatePath(`/materiales/${input.materialId}`);
	return { success: true };
}

/**
 * Avanza el estado de una Sesión: preparación → lobby → en curso → cerrada → histórico.
 * El club/moderador lo decide; el estado propio de cada Sesión es parte del AC4.
 */
export async function advanceSession(input: {
	materialId: string;
	sessionId: string;
}): Promise<ActionResult> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("sessions")
		.select("status")
		.eq("id", input.sessionId)
		.single();

	if (error || !data) {
		return { error: "No se encontró la sesión para avanzar." };
	}

	const order = [
		"preparation",
		"lobby",
		"in_progress",
		"closed",
		"archived",
	] as const;
	const currentIndex = order.indexOf(data.status);
	const nextStatus = order[currentIndex + 1];

	if (!nextStatus) {
		return { success: true };
	}

	const { error: updateError } = await supabase
		.from("sessions")
		.update({ status: nextStatus })
		.eq("id", input.sessionId);

	if (updateError) {
		return {
			error: `No se pudo avanzar la sesión: ${updateError.message}`,
		};
	}

	revalidatePath(`/materiales/${input.materialId}`);
	return { success: true };
}
