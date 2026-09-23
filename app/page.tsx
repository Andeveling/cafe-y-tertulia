import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/current-member";
import { LAST_GROUP_COOKIE, landingPath } from "@/lib/groups/active-group";
import { getMyGroups } from "@/lib/groups/queries";

export const metadata = { title: "Sesiones · Café y Tertulia" };

/** `/` no es un club. Abre el último Grupo, el único, o Mis Grupos. */
export default async function HomePage() {
	const { member, supabase } = await getCurrentMember();

	if (!member) redirect("/auth/login");
	if (member.status !== "active") redirect("/auth/invite");

	const groups = await getMyGroups(supabase, member.id);
	const cookieStore = await cookies();
	redirect(
		landingPath(
			groups.map((group) => group.slug),
			cookieStore.get(LAST_GROUP_COOKIE)?.value,
		),
	);
}
