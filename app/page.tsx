import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/current-member";
import { StartBoard } from "./_components/start-board";
import {
	getMaterialOptions,
	getOpenSessions,
	getRosterMembers,
} from "./_lib/home";

export const metadata = { title: "Sesiones · Café y Tertulia" };

export default async function HomePage() {
	const { member, supabase } = await getCurrentMember();

	if (!member) redirect("/auth/login");
	if (member.status !== "active") redirect("/auth/invite");

	const [sessions, materials, rosterMembers] = await Promise.all([
		getOpenSessions(supabase),
		getMaterialOptions(supabase),
		getRosterMembers(supabase),
	]);

	return (
		<StartBoard
			sessions={sessions}
			materials={materials}
			displayName={member.display_name || "Miembro"}
			rosterMembers={rosterMembers}
			userId={member.id}
		/>
	);
}
