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
