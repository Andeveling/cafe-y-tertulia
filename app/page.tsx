import { redirect } from "next/navigation";
import type { RosterMember } from "@/hooks/use-club-presence";
import { getCurrentMember } from "@/lib/current-member";
import { type BoardSession, InicioBoard } from "./_components/inicio-board";

export const metadata = { title: "Inicio · Café y Tertulia" };

export default async function HomePage() {
	const { member, supabase } = await getCurrentMember();

	if (!member) {
		redirect("/auth/login");
	}

	if (member.status !== "active") {
		redirect("/auth/invite");
	}

	// Fetch sessions: exclude closed/archived. Join moderator + material.
	const { data: rawSessions } = await supabase
		.from("sessions")
		.select(
			`id, status, scheduled_at, range,
			 moderator:members!sessions_moderator_id_fkey(display_name),
			 material:materials(title)`,
		)
		.not("status", "in", '("closed","archived")')
		.order("scheduled_at", { ascending: true, nullsFirst: false });

	const sessions: BoardSession[] = (rawSessions ?? [])
		.map((s) => ({
			id: s.id,
			status: s.status as BoardSession["status"],
			scheduled_at: s.scheduled_at,
			range: s.range,
			moderator_name:
				(s.moderator as { display_name: string | null } | null)?.display_name ??
				null,
			material_title:
				(s.material as { title: string | null } | null)?.title ?? null,
		}))
		// Sort: lobby/in_progress first, then preparation by scheduled_at
		.sort((a, b) => {
			const aOpen = a.status === "lobby" || a.status === "in_progress";
			const bOpen = b.status === "lobby" || b.status === "in_progress";
			if (aOpen !== bOpen) return aOpen ? -1 : 1;
			// Both preparation: scheduled first, undated last
			if (a.scheduled_at && b.scheduled_at)
				return a.scheduled_at.localeCompare(b.scheduled_at);
			if (a.scheduled_at) return -1;
			if (b.scheduled_at) return 1;
			return 0;
		});

	// Fetch materials for the create form
	const { data: rawMaterials } = await supabase
		.from("materials")
		.select("id, title")
		.order("title");

	const materials = (rawMaterials ?? []).map((m) => ({
		id: m.id,
		title: m.title,
	}));

	// Fetch active members for the presence roster
	const { data: rawMembers } = await supabase
		.from("members")
		.select("id, display_name")
		.eq("status", "active");

	const rosterMembers: RosterMember[] = (rawMembers ?? []).map((m) => ({
		id: m.id,
		display_name: m.display_name,
	}));

	return (
		<InicioBoard
			sessions={sessions}
			materials={materials}
			displayName={member.display_name || "Miembro"}
			rosterMembers={rosterMembers}
			userId={member.id}
		/>
	);
}
