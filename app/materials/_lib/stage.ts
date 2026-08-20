import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { AssignmentState } from "./intervention";

export type StageClient = Pick<SupabaseClient<Database>, "rpc">;

export type StageSnapshot =
	| {
			mode: "active";
			sessionId: string;
			materialId: string;
			range: string;
			status: string;
			moderatorId: string | null;
			assignmentId: string;
			state: AssignmentState;
			questionText: string;
			assigneeName: string;
			assigneeId: string;
			authorName: string;
			revealOrder: number;
			myNotes: string | null;
			remainingHidden: number;
	  }
	| {
			mode: "waiting_reveal";
			sessionId: string;
			materialId: string;
			range: string;
			status: string;
			moderatorId: string | null;
			nextAssigneeName: string;
			nextAssigneeId: string;
			revealOrder: number;
			remainingHidden: number;
	  }
	| {
			mode: "done";
			sessionId: string;
			materialId: string;
			range: string;
			status: string;
			moderatorId: string | null;
			remainingHidden: number;
	  };

function asString(v: Json | undefined, fallback = ""): string {
	return typeof v === "string" ? v : fallback;
}

function asNumber(v: Json | undefined, fallback = 0): number {
	return typeof v === "number" ? v : fallback;
}

export async function getStageSnapshot(
	supabase: StageClient,
	sessionId: string,
): Promise<StageSnapshot | null> {
	const { data, error } = await supabase.rpc("stage_snapshot", {
		target_session_id: sessionId,
	});
	if (error) throw error;
	if (!data || typeof data !== "object" || Array.isArray(data)) return null;

	const row = data as Record<string, Json | undefined>;
	const mode = asString(row.mode);
	const base = {
		sessionId: asString(row.sessionId),
		materialId: asString(row.materialId),
		range: asString(row.range),
		status: asString(row.status),
		moderatorId: row.moderatorId == null ? null : asString(row.moderatorId),
		remainingHidden: asNumber(row.remainingHidden),
	};

	if (mode === "active") {
		return {
			...base,
			mode: "active",
			assignmentId: asString(row.assignmentId),
			state: asString(row.state) as AssignmentState,
			questionText: asString(row.questionText),
			assigneeName: asString(row.assigneeName),
			assigneeId: asString(row.assigneeId),
			authorName: asString(row.authorName),
			revealOrder: asNumber(row.revealOrder),
			myNotes: row.myNotes == null ? null : asString(row.myNotes),
		};
	}

	if (mode === "waiting_reveal") {
		return {
			...base,
			mode: "waiting_reveal",
			nextAssigneeName: asString(row.nextAssigneeName),
			nextAssigneeId: asString(row.nextAssigneeId),
			revealOrder: asNumber(row.revealOrder),
		};
	}

	if (mode === "done") {
		return { ...base, mode: "done" };
	}

	return null;
}
