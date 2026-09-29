import "server-only";

import { notFound, redirect } from "next/navigation";
import { inactiveMemberDestination } from "@/lib/auth/redirect";
import { getCurrentMember } from "@/lib/current-member";
import { type GroupBySlug, getGroupBySlug } from "@/lib/groups/queries";
import type { GroupRole } from "@/lib/groups/types";

/** Grupo resuelto por el gate: la pertenencia ya está probada. */
export type GatedGroup = GroupBySlug & { role: GroupRole };

/**
 * Seam único del gate de páginas: exige sesión, membresía activa y
 * pertenencia al Grupo. El layout y las páginas lo llaman en vez de
 * pegar la secuencia; la lógica de a dónde va cada estado vive aquí.
 */
export async function requireGroupPage(
	slug: string,
	options?: { onMissing?: "not-found" | "mis-grupos" },
): Promise<{
	supabase: Awaited<ReturnType<typeof getCurrentMember>>["supabase"];
	member: NonNullable<Awaited<ReturnType<typeof getCurrentMember>>["member"]>;
	group: GatedGroup;
}> {
	const { member, supabase } = await getCurrentMember();

	if (!member) redirect("/auth/login");
	const inactiveDestination = inactiveMemberDestination(member.status);
	if (inactiveDestination) redirect(inactiveDestination);

	const group = await getGroupBySlug(supabase, slug, member.id);
	if (!group || group.role == null) {
		if (options?.onMissing === "mis-grupos") redirect("/g");
		notFound();
	}
	return { supabase, member, group: { ...group, role: group.role } };
}

/**
 * Puerta de Miembro activo sin Grupo: para las páginas que solo orientan
 * (/, /materials) antes de redirigir al Grupo activo.
 */
export async function requireActiveMemberPage(): Promise<{
	supabase: Awaited<ReturnType<typeof getCurrentMember>>["supabase"];
	member: NonNullable<Awaited<ReturnType<typeof getCurrentMember>>["member"]>;
}> {
	const { member, supabase } = await getCurrentMember();

	if (!member) redirect("/auth/login");
	const inactiveDestination = inactiveMemberDestination(member.status);
	if (inactiveDestination) redirect(inactiveDestination);

	return { supabase, member };
}
