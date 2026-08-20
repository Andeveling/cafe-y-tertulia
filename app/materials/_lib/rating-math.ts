/** Aggregate session ratings (SPEC §7 · ADR 0003). */

export function ratingAggregate(stars: readonly number[]): {
	avg: number | null;
	count: number;
} {
	const valid = stars.filter((s) => s >= 1 && s <= 5 && Number.isInteger(s));
	if (valid.length === 0) return { avg: null, count: 0 };
	const sum = valid.reduce((a, b) => a + b, 0);
	// 1 decimal, half-up via banker's-free round
	const avg = Math.round((sum / valid.length) * 10) / 10;
	return { avg, count: valid.length };
}

/** Weighted material avg from frozen session aggregates. */
export function materialRatingFromSessions(
	sessions: ReadonlyArray<{ avg: number | null; count: number }>,
): { avg: number | null; count: number } {
	let sum = 0;
	let count = 0;
	for (const s of sessions) {
		if (s.avg == null || s.count <= 0) continue;
		sum += s.avg * s.count;
		count += s.count;
	}
	if (count === 0) return { avg: null, count: 0 };
	return { avg: Math.round((sum / count) * 10) / 10, count };
}
