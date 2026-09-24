import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { inactiveMemberDestination } from "@/lib/auth/redirect";
import { getCurrentMember } from "@/lib/current-member";
import { LAST_GROUP_COOKIE, landingPath } from "@/lib/groups/active-group";
import { getMyGroups } from "@/lib/groups/queries";

/** La estantería vive en el Grupo activo, no en un pool mezclado. */
export default async function MaterialsPage() {
	const { member, supabase } = await getCurrentMember();
	if (!member) redirect("/auth/login");
	const inactiveDestination = inactiveMemberDestination(member.status);
	if (inactiveDestination) redirect(inactiveDestination);

	const groups = await getMyGroups(supabase, member.id);
	const cookieStore = await cookies();
	redirect(
		landingPath(
			groups.map((group) => group.slug),
			cookieStore.get(LAST_GROUP_COOKIE)?.value,
			"materiales",
		),
	);
}
