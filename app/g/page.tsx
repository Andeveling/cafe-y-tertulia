import { redirect } from "next/navigation";
import { MisGruposView } from "@/app/g/_components/mis-grupos-view";
import { getCurrentMember } from "@/lib/current-member";
import { getMyGroups, getPublicCatalog } from "@/lib/groups/queries";

export const metadata = { title: "Mis grupos · Café y Tertulia" };

/**
 * /g — Mis Grupos: mis grupos con presencia + catálogo público.
 * Sin grupo no hay acceso a materiales/sesiones: esta pantalla es la puerta.
 */
export default async function MisGruposPage() {
	const { member, supabase } = await getCurrentMember();

	if (!member) redirect("/auth/login");
	if (member.status !== "active") redirect("/auth/invite");

	const [myGroups, catalog] = await Promise.all([
		getMyGroups(supabase, member.id),
		getPublicCatalog(supabase),
	]);

	return <MisGruposView myGroups={myGroups} catalog={catalog} />;
}
