"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type RosterMember = {
	id: string;
	display_name: string;
};

/**
 * Supabase Realtime Presence on channel `club-roster`.
 * Presence key = member id (one key across tabs).
 * Reconciles on `sync`; ignores join/leave.
 */
export function useClubPresence(
	userId: string | undefined,
	members: RosterMember[],
) {
	const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (!userId) return;
		const supabase = createClient();
		const channel = supabase.channel("club-roster", {
			config: { presence: { key: userId } },
		});

		channel.on("presence", { event: "sync" }, () => {
			const state = channel.presenceState();
			setOnlineIds(new Set(Object.keys(state)));
		});

		channel.subscribe(async (status) => {
			if (status === "SUBSCRIBED") {
				await channel.track({ user_id: userId });
			}
		});

		return () => {
			channel.untrack();
			channel.unsubscribe();
			supabase.removeChannel(channel);
		};
	}, [userId]);

	// Merge: online members first, then offline
	const roster = members.map((m) => ({
		...m,
		online: onlineIds.has(m.id),
	}));

	roster.sort((a, b) => {
		if (a.online !== b.online) return a.online ? -1 : 1;
		return a.display_name.localeCompare(b.display_name);
	});

	return roster;
}
