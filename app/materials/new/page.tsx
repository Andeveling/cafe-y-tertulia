import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LAST_GROUP_COOKIE, landingPath } from "@/lib/groups/active-group";
import { requireActiveMemberPage } from "@/lib/groups/page-gate";
import { getMyGroups } from "@/lib/groups/queries";

/** La estantería vive en el Grupo activo, no en un pool mezclado. */
export default async function NewMaterialPage() {
	const { member, supabase } = await requireActiveMemberPage();

	const groups = await getMyGroups(supabase, member.id);
	const cookieStore = await cookies();
	const slugs = groups.map((group) => group.slug);
	const lastSlug = cookieStore.get(LAST_GROUP_COOKIE)?.value;
	redirect(landingPath(slugs, lastSlug, "materials"));
}
