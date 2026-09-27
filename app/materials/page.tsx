import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LAST_GROUP_COOKIE, landingPath } from "@/lib/groups/active-group";
import { requireActiveMemberPage } from "@/lib/groups/page-gate";
import { getMyGroups } from "@/lib/groups/queries";

/** La estantería vive en el Grupo activo, no en un pool mezclado. */
export default async function MaterialsPage() {
	const { member, supabase } = await requireActiveMemberPage();

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
