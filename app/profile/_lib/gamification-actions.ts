"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";

export type MemberBadge = {
	key: string;
	emoji: string;
	name: string;
	description: string;
	kind: "individual" | "collective";
	earned: boolean;
	earnedDate?: string;
	context?: string;
};

export type SeasonRecognition = {
	category: string;
	emoji: string;
	label: string;
	seasonMonth: string;
};

export type MemberLevel = {
	level: number;
	title: string;
	sessionsAttended: number;
	insigniasCount: number;
	currentThreshold: number;
	nextThreshold: number;
	nextTitle: string;
	nextInsigniasRequired: number;
};

/**
 * Computes the member's level from session attendance and individual badges.
 * Calls the DB function compute_member_level — no new tables, derived on-the-fly.
 */
export async function getMemberLevel(memberId: string): Promise<MemberLevel> {
	const supabase = await createServerClient();

	const { data, error } = await supabase.rpc("compute_member_level", {
		target_member_id: memberId,
	});

	if (error || !data) {
		return {
			level: 0,
			title: "",
			sessionsAttended: 0,
			insigniasCount: 0,
			currentThreshold: 0,
			nextThreshold: 1,
			nextTitle: "Novato",
			nextInsigniasRequired: 0,
		};
	}

	const d = data as Record<string, unknown>;
	return {
		level: d.level as number,
		title: d.title as string,
		sessionsAttended: d.sessions_attended as number,
		insigniasCount: d.insignias_count as number,
		currentThreshold: d.current_threshold as number,
		nextThreshold: d.next_threshold as number,
		nextTitle: d.next_title as string,
		nextInsigniasRequired: d.next_insignias_required as number,
	};
}

/**
 * Fetches all badges for the current member: which ones they've earned
 * (with date and context) and which remain. Also fetches any season
 * recognitions they've received.
 *
 * All display metadata (name, description, emoji) comes from the DB,
 * so adding a new badge is a data-only change — no code edits needed.
 */
export async function getMemberBadges(memberId: string) {
	const supabase = await createServerClient();

	// All badges in the catalog (name + description from DB)
	const { data: allBadges } = await supabase
		.from("badges")
		.select("id, key, emoji, name, description, kind")
		.order("kind", { ascending: true })
		.order("created_at", { ascending: true });

	if (!allBadges) return { badges: [], recognitions: [] };

	// Awards for this member (individual) or club (collective)
	const { data: awards } = await supabase
		.from("awards")
		.select("badge_id, created_at, trigger, session_id, member_id")
		.or(`member_id.eq.${memberId},member_id.is.null`)
		.order("created_at", { ascending: false });

	// Season recognitions for this member (with category metadata)
	const { data: recognitions } = await supabase
		.from("season_recognitions")
		.select(
			"category, season_id, seasons(starts_at), recognition_category_meta(emoji, name)",
		)
		.eq("member_id", memberId)
		.order("created_at", { ascending: false });

	// Build a map of earned badges
	const earnedMap = new Map<string, { date: string; context?: string }>();
	for (const award of awards ?? []) {
		const badgeId = award.badge_id;
		const badge = allBadges.find((b) => b.id === badgeId);
		if (!badge) continue;

		// For individual badges, only count this member's awards
		if (badge.kind === "individual" && award.member_id !== memberId) continue;
		if (!earnedMap.has(badgeId)) {
			earnedMap.set(badgeId, {
				date: award.created_at,
				context: award.trigger,
			});
		}
	}

	const badges: MemberBadge[] = allBadges.map((b) => {
		const earned = earnedMap.get(b.id);
		return {
			key: b.key,
			emoji: b.emoji,
			name: b.name,
			description: b.description,
			kind: b.kind as "individual" | "collective",
			earned: !!earned,
			earnedDate: earned?.date,
			context: earned?.context,
		};
	});

	const formattedRecognitions: SeasonRecognition[] = (recognitions ?? []).map(
		(r) => {
			const meta = (
				r as unknown as {
					recognition_category_meta: { emoji: string; name: string } | null;
				}
			).recognition_category_meta;
			const startsAt = (r.seasons as unknown as { starts_at: string })
				?.starts_at;
			return {
				category: r.category,
				emoji: meta?.emoji ?? "🏅",
				label: meta?.name ?? r.category,
				seasonMonth: startsAt
					? new Date(startsAt).toLocaleDateString("es", {
							month: "long",
							year: "numeric",
						})
					: "",
			};
		},
	);

	return { badges, recognitions: formattedRecognitions };
}
