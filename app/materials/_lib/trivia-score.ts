/** Pure scoring for trivia rounds (SPEC §5.1). No per-question wrongs exported. */

export type TriviaHit = { memberId: string; displayName: string; hits: number };

export function scoreHits(
	answers: ReadonlyArray<{ memberId: string; optionIndex: number }>,
	correctIndex: number,
	previous: ReadonlyMap<string, number> = new Map(),
): Map<string, number> {
	const next = new Map(previous);
	for (const a of answers) {
		if (a.optionIndex !== correctIndex) continue;
		next.set(a.memberId, (next.get(a.memberId) ?? 0) + 1);
	}
	return next;
}

export function scoreboard(
	hits: ReadonlyMap<string, number>,
	names: ReadonlyMap<string, string>,
): TriviaHit[] {
	const rows: TriviaHit[] = [];
	for (const [memberId, name] of names) {
		rows.push({
			memberId,
			displayName: name,
			hits: hits.get(memberId) ?? 0,
		});
	}
	return rows.sort(
		(a, b) =>
			b.hits - a.hits || a.displayName.localeCompare(b.displayName, "es"),
	);
}

/** Unique top scorer, or null on tie / empty / all zero. Feeds elephant_memory. */
export function triviaWinner(board: readonly TriviaHit[]): string | null {
	if (board.length === 0) return null;
	const top = board[0].hits;
	if (top <= 0) return null;
	const tops = board.filter((r) => r.hits === top);
	return tops.length === 1 ? tops[0].memberId : null;
}

export function takeCounts(
	votes: ReadonlyArray<"agree" | "disagree" | "neutral">,
): { agree: number; disagree: number; neutral: number } {
	const c = { agree: 0, disagree: 0, neutral: 0 };
	for (const v of votes) c[v] += 1;
	return c;
}
