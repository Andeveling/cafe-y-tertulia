import type {
	MemberBadge,
	MemberLevel,
} from "@/app/profile/_lib/gamification-actions";

export type BadgePartition = {
	individual: MemberBadge[];
	collective: MemberBadge[];
	earnedIndividual: number;
	totalIndividual: number;
	earnedCollective: number;
};

/** Parte insignias en una sola pasada (js-combine-iterations). */
export function partitionBadges(badges: MemberBadge[]): BadgePartition {
	const individual: MemberBadge[] = [];
	const collective: MemberBadge[] = [];
	let earnedIndividual = 0;
	let earnedCollective = 0;
	for (const b of badges) {
		if (b.kind === "individual") {
			individual.push(b);
			if (b.earned) earnedIndividual += 1;
		} else {
			collective.push(b);
			if (b.earned) earnedCollective += 1;
		}
	}
	return {
		individual,
		collective,
		earnedIndividual,
		totalIndividual: individual.length,
		earnedCollective,
	};
}

export function statusLabel(status: string) {
	if (status === "active") return "activo";
	if (status === "invited") return "invitado";
	return "baja";
}

export type LevelProgress = {
	progress: number;
	sessionsToNext: number;
};

/** Progreso 0–100 hacia el próximo nivel, derivado en render. */
export function levelProgress(level: MemberLevel): LevelProgress {
	const span =
		level.nextThreshold > level.currentThreshold
			? level.nextThreshold - level.currentThreshold
			: 1;
	const progress = Math.min(
		100,
		Math.max(
			0,
			Math.round(
				((level.sessionsAttended - level.currentThreshold) / span) * 100,
			),
		),
	);
	return {
		progress,
		sessionsToNext: Math.max(0, level.nextThreshold - level.sessionsAttended),
	};
}
