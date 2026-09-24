import { redirect } from "next/navigation";
import { MisGruposView } from "@/app/g/_components/mis-grupos-view";
import { inactiveMemberDestination } from "@/lib/auth/redirect";
import { getCurrentMember } from "@/lib/current-member";
import { getMyGroups, getPublicCatalog } from "@/lib/groups/queries";

export const metadata = { title: "Mis grupos · Café y Tertulias" };

/**
 * /g — Mis Grupos: mis grupos con presencia + catálogo público.
 * Sin grupo no hay acceso a materiales/sesiones: esta pantalla es la puerta.
 */
export default async function MisGruposPage({
	searchParams,
}: {
	searchParams: Promise<{ crear?: string }>;
}) {
	const { member, supabase } = await getCurrentMember();

	if (!member) redirect("/auth/login");
	const inactiveDestination = inactiveMemberDestination(member.status);
	if (inactiveDestination) redirect(inactiveDestination);

	const [myGroups, catalog] = await Promise.all([
		getMyGroups(supabase, member.id),
		getPublicCatalog(supabase),
	]);
	const { crear } = await searchParams;

	return (
		<MisGruposView
			myGroups={myGroups}
			catalog={catalog}
			startCreating={crear === "1"}
		/>
	);
}
