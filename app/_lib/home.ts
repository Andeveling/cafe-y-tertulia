import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RosterMember } from "@/hooks/use-club-presence";
import type { BoardSession } from "../_components/start-board";

/** Sessions visible on the home board: exclude closed/archived. */
export async function getOpenSessions(
	supabase: SupabaseClient,
): Promise<BoardSession[]> {
	const { data: rawSessions } = await supabase
		.from("sessions")
		.select(
			`id, status, scheduled_at, range, moderator_id, material_id,
			 moderator:members!sessions_moderator_id_fkey(display_name),
			 material:materials(title)`,
		)
		.not("status", "in", '("closed","archived")')
		.order("scheduled_at", { ascending: true, nullsFirst: false });

	return (
		(rawSessions ?? [])
			.map((s) => ({
				id: s.id,
				status: s.status as BoardSession["status"],
				scheduled_at: s.scheduled_at,
				range: s.range,
				moderator_id: s.moderator_id,
				moderator_name:
					(s.moderator as unknown as { display_name: string | null } | null)
						?.display_name ?? null,
				material_id: s.material_id,
				material_title:
					(s.material as unknown as { title: string | null } | null)?.title ??
					null,
			}))
			// lobby/in_progress first, then preparation by scheduled_at
			.sort((a, b) => {
				const aOpen = a.status === "lobby" || a.status === "in_progress";
				const bOpen = b.status === "lobby" || b.status === "in_progress";
				if (aOpen !== bOpen) return aOpen ? -1 : 1;
				// scheduled first, undated last
				if (a.scheduled_at && b.scheduled_at)
					return a.scheduled_at.localeCompare(b.scheduled_at);
				if (a.scheduled_at) return -1;
				if (b.scheduled_at) return 1;
				return 0;
			})
	);
}

export async function getMaterialOptions(
	supabase: SupabaseClient,
): Promise<{ id: string; title: string }[]> {
	const { data } = await supabase
		.from("materials")
		.select("id, title")
		.order("title");

	return data ?? [];
}

export async function getRosterMembers(
	supabase: SupabaseClient,
): Promise<RosterMember[]> {
	const { data } = await supabase
		.from("members")
		.select("id, display_name")
		.eq("status", "active");

	return data ?? [];
}
