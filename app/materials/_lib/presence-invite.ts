/**
 * Candidatos a invitar desde Presentes: Miembros activos menos los ya
 * presentes, ordenados online primero. Puro y testeable sin React.
 */

export type InviteRosterMember = {
	id: string;
	display_name: string;
};

export type InviteCandidate = {
	id: string;
	displayName: string;
	online: boolean;
	pending: boolean;
};

export function buildInviteCandidates(args: {
	roster: InviteRosterMember[];
	onlineIds: Set<string> | string[];
	participantIds: Set<string> | string[];
	pendingIds?: Set<string> | string[];
	selfId?: string | null;
}): InviteCandidate[] {
	const online =
		args.onlineIds instanceof Set ? args.onlineIds : new Set(args.onlineIds);
	const participants =
		args.participantIds instanceof Set
			? args.participantIds
			: new Set(args.participantIds);
	const pending = args.pendingIds
		? args.pendingIds instanceof Set
			? args.pendingIds
			: new Set(args.pendingIds)
		: new Set<string>();

	const out: InviteCandidate[] = [];
	for (const m of args.roster) {
		if (args.selfId && m.id === args.selfId) continue;
		if (participants.has(m.id)) continue;
		out.push({
			id: m.id,
			displayName: m.display_name,
			online: online.has(m.id),
			pending: pending.has(m.id),
		});
	}

	out.sort((a, b) => {
		if (a.online !== b.online) return a.online ? -1 : 1;
		return a.displayName.localeCompare(b.displayName);
	});
	return out;
}
