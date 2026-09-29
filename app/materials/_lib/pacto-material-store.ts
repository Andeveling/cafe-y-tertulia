import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PactMode, PactStatus } from "./pacto-material";

export type MaterialPactRow = {
	id: string;
	group_id: string;
	nomination_id: string;
	proposed_by: string;
	mode: PactMode;
	status: PactStatus;
	expires_at: string | null;
	material_id: string | null;
	session_id: string | null;
	created_at: string;
	approvals: number;
};

const PACT_COLUMNS =
	"id, group_id, nomination_id, proposed_by, mode, status, expires_at, material_id, session_id, created_at";

function countApprovalsByPact(
	approvalRows: { pact_id: string }[],
): Map<string, number> {
	const counts = new Map<string, number>();
	for (const row of approvalRows) {
		counts.set(row.pact_id, (counts.get(row.pact_id) ?? 0) + 1);
	}
	return counts;
}

/**
 * Gancho legible para el barista (#90, historia 26): pactos pendientes
 * visibles con conteo de aprobaciones y vencimiento. La escritura pasa por
 * los RPCs atómicos (propose/approve/room), nunca directo.
 */
export const listPendingPacts = cache(
	async (groupId: string): Promise<MaterialPactRow[]> => {
		const supabase = await createClient();
		const { data: pactRows, error } = await supabase
			.from("material_pacts")
			.select(PACT_COLUMNS)
			.eq("group_id", groupId)
			.eq("status", "pending")
			.order("created_at", { ascending: true });
		if (error) throw error;
		if (!pactRows || pactRows.length === 0) return [];
		const ids = pactRows.map((pact) => pact.id);
		const { data: approvalRows, error: approvalsError } = await supabase
			.from("material_pact_approvals")
			.select("pact_id")
			.in("pact_id", ids);
		if (approvalsError) throw approvalsError;
		const counts = countApprovalsByPact(approvalRows ?? []);
		return pactRows.map((pact) => ({
			id: pact.id,
			group_id: pact.group_id,
			nomination_id: pact.nomination_id,
			proposed_by: pact.proposed_by,
			mode: pact.mode,
			status: pact.status,
			expires_at: pact.expires_at,
			material_id: pact.material_id,
			session_id: pact.session_id,
			created_at: pact.created_at,
			approvals: counts.get(pact.id) ?? 0,
		}));
	},
);
