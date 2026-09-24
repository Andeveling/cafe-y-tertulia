import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { inactiveMemberDestination } from "@/lib/auth/redirect";
import { getCurrentMember } from "@/lib/current-member";
import { LAST_GROUP_COOKIE, landingPath } from "@/lib/groups/active-group";
import { getMyGroups } from "@/lib/groups/queries";

/** Proponer un material es del Grupo activo, no de un pool mezclado. */
export default async function NewMaterialPage() {
	const { member, supabase } = await getCurrentMember();
	if (!member) redirect("/auth/login");
	const inactiveDestination = inactiveMemberDestination(member.status);
	if (inactiveDestination) redirect(inactiveDestination);

	const groups = await getMyGroups(supabase, member.id);
	const cookieStore = await cookies();
	const path = landingPath(
		groups.map((group) => group.slug),
		cookieStore.get(LAST_GROUP_COOKIE)?.value,
		"materiales",
	);
	redirect(path === "/g" ? "/g" : `${path}/nuevo`);
}
