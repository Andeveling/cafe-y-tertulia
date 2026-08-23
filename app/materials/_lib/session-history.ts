import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { MaterialKind, MaterialStatus, SessionStatus } from "./constants";
import {
	asArray,
	asBool,
	asNullString,
	asNumber,
	asString,
} from "./json-helpers";

type SessionHistoryClient = Pick<SupabaseClient<Database>, "from" | "rpc">;

export type SessionHistory = {
	id: string;
	range: string;
	status: SessionStatus;
	scheduled_at: string | null;
	created_at: string;
	rating_avg: number | null;
	rating_count: number;
	material: {
		id: string;
		title: string;
		kind: MaterialKind;
		author: string;
		status: MaterialStatus;
		rating_avg: number | null;
		rating_count: number;
	};
	participants: {
		member_id: string;
		display_name: string;
		opt_out: boolean;
	}[];
	questions: {
		id: string;
		text: string;
		author: string;
		created_at: string;
		assignment?: {
			id: string;
			assignee: string;
			state: string;
			notes: string;
		};
	}[];
	trivia_rounds: {
		id: string;
		title: string;
		status: string;
		items: {
			member_id: string;
			display_name: string;
			hits: number;
		}[];
	}[];
	takes: {
		id: string;
		prompt: string;
		status: string;
		counts: { agree: number; disagree: number; neutral: number };
	}[];
	awards: {
		id: string;
		trigger: string;
		member_id: string | null;
		display_name: string | null;
		emoji: string;
		name: string;
		badge_key: string;
	}[];
};

/** Lectura de una Sesión para el Histórico: una sola llamada al RPC `get_session_history`. */
export async function getSessionHistory(
	supabase: SessionHistoryClient,
	id: string,
): Promise<SessionHistory | null> {
	const { data, error } = await supabase.rpc(
		"get_session_history" as never,
		{
			target_session_id: id,
		} as never,
	);
	if (error) throw error;
	if (!data || typeof data !== "object" || Array.isArray(data)) return null;

	const row = data as Record<string, Json | undefined>;
	const material = (row.material ?? {}) as Record<string, Json | undefined>;

	return {
		id: asString(row.id),
		range: asString(row.range),
		status: asString(row.status) as SessionStatus,
		scheduled_at: asNullString(row.scheduled_at),
		created_at: asString(row.created_at),
		rating_avg: typeof row.rating_avg === "number" ? row.rating_avg : null,
		rating_count: asNumber(row.rating_count),
		material: {
			id: asString(material.id),
			title: asString(material.title),
			kind: asString(material.kind) as MaterialKind,
			author: asString(material.author),
			status: asString(material.status) as MaterialStatus,
			rating_avg:
				typeof material.rating_avg === "number" ? material.rating_avg : null,
			rating_count: asNumber(material.rating_count),
		},
		participants: asArray<Record<string, Json | undefined>>(
			row.participants,
		).map((p) => ({
			member_id: asString(p.member_id),
			display_name: asString(p.display_name),
			opt_out: asBool(p.opt_out),
		})),
		questions: asArray<Record<string, Json | undefined>>(row.questions).map(
			(q) => {
				const assignment = q.assignment as
					| Record<string, Json | undefined>
					| undefined;
				return {
					id: asString(q.id),
					text: asString(q.text),
					author: asString(q.author),
					created_at: asString(q.created_at),
					...(assignment
						? {
								assignment: {
									id: asString(assignment.id),
									assignee: asString(assignment.assignee),
									state: asString(assignment.state),
									notes: asString(assignment.notes),
								},
							}
						: {}),
				};
			},
		),
		trivia_rounds: asArray<Record<string, Json | undefined>>(
			row.trivia_rounds,
		).map((round) => ({
			id: asString(round.id),
			title: asString(round.title),
			status: asString(round.status),
			items: asArray<Record<string, Json | undefined>>(round.items).map(
				(hit) => ({
					member_id: asString(hit.member_id),
					display_name: asString(hit.display_name),
					hits: asNumber(hit.hits),
				}),
			),
		})),
		takes: asArray<Record<string, Json | undefined>>(row.takes).map((take) => {
			const counts = (take.counts ?? {}) as Record<string, Json | undefined>;
			return {
				id: asString(take.id),
				prompt: asString(take.prompt),
				status: asString(take.status),
				counts: {
					agree: asNumber(counts.agree),
					disagree: asNumber(counts.disagree),
					neutral: asNumber(counts.neutral),
				},
			};
		}),
		awards: asArray<Record<string, Json | undefined>>(row.awards).map(
			(award) => ({
				id: asString(award.id),
				trigger: asString(award.trigger),
				member_id: asNullString(award.member_id),
				display_name: asNullString(award.display_name),
				emoji: asString(award.emoji, "🏆"),
				name: asString(award.name),
				badge_key: asString(award.badge_key),
			}),
		),
	};
}
