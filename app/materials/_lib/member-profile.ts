import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { MaterialsClient } from "./constants";

/** Perfil público de un Miembro con sus insignias. */
export async function getMemberProfile(
	supabase: MaterialsClient,
	memberId: string,
): Promise<{
	id: string;
	display_name: string;
	avatar: string | null;
	awards: {
		id: string;
		emoji: string;
		name: string;
		badge_key: string;
		trigger: string;
		session_id: string | null;
		created_at: string;
	}[];
} | null> {
	const { data: member, error } = await supabase
		.from("members")
		.select("id, display_name, avatar")
		.eq("id", memberId)
		.single();

	if (error || !member) return null;

	const { data: awards } = await supabase
		.from("awards")
		.select("id, trigger, session_id, created_at, badges(key, name, emoji)")
		.eq("member_id", memberId)
		.order("created_at", { ascending: false });

	return {
		id: member.id,
		display_name: member.display_name,
		avatar: member.avatar,
		awards: (awards ?? []).map((a) => ({
			id: a.id,
			emoji: a.badges?.emoji ?? "🏆",
			name: a.badges?.name ?? a.badges?.key ?? "",
			badge_key: a.badges?.key ?? "",
			trigger: a.trigger,
			session_id: a.session_id,
			created_at: a.created_at,
		})),
	};
}

/** Hitos colectivos del club (badges con kind = 'collective'). */
export async function getClubMilestones(supabase: MaterialsClient): Promise<
	{
		id: string;
		emoji: string;
		name: string;
		badge_key: string;
		trigger: string;
		created_at: string;
	}[]
> {
	const { data } = await supabase
		.from("awards")
		.select("id, trigger, created_at, badges(key, name, emoji, kind)")
		.is("member_id", null)
		.order("created_at", { ascending: false });

	return (data ?? [])
		.filter((a) => a.badges?.kind === "collective")
		.map((a) => ({
			id: a.id,
			emoji: a.badges?.emoji ?? "🏆",
			name: a.badges?.name ?? a.badges?.key ?? "",
			badge_key: a.badges?.key ?? "",
			trigger: a.trigger,
			created_at: a.created_at,
		}));
}
