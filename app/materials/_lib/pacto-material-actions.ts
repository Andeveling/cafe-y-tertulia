"use server";

import { type ActionResult, runServerAction } from "@/lib/server-action";

export type ProposePactResult = { pactId: string };

export type ApprovePactResult = {
	status: "pending" | "agreed" | "expired";
	pactId?: string;
	materialId?: string;
	sessionId?: string;
	approvals?: number;
	needed?: number;
};

export type RoomPactInput = {
	nominationId: string;
	range?: string | null;
	scheduledAt?: string | null;
	slug: string;
};

export type ProposeMaterialPactInput = {
	nominationId: string;
	slug: string;
};

export type ApproveMaterialPactInput = {
	pactId: string;
	slug: string;
};

type PactRpcRow = {
	status?: string;
	pact_id?: string;
	material_id?: string;
	session_id?: string;
	approvals?: number;
	needed?: number;
	needs_draw?: boolean;
};

function materialsPath(slug: string): string {
	return `/g/${slug}/materials`;
}

const DEFAULT_PACT_RANGE = "Por definir";

function normalizePactRange(range?: string | null): string {
	return range?.trim() || DEFAULT_PACT_RANGE;
}

function toApproveResult(row: PactRpcRow): ApprovePactResult {
	if (row.status === "agreed") {
		return {
			status: "agreed",
			pactId: row.pact_id,
			materialId: row.material_id,
			sessionId: row.session_id,
		};
	}
	if (row.status === "expired" || row.needs_draw === true) {
		return { status: "expired", pactId: row.pact_id };
	}
	return {
		status: "pending",
		pactId: row.pact_id,
		approvals: row.approvals,
		needed: row.needed,
	};
}

/**
 * Pacto en Sala (#90): lo declara el Moderador (admin) sobre un postulado
 * existente. Resuelve de inmediato (clon a seleccionado + Sesión, origen
 * pact) y cancela los otros pendientes.
 */
export async function resolveRoomPact(
	input: RoomPactInput,
): Promise<ActionResult & { data?: ApprovePactResult }> {
	let resolved: ApprovePactResult | null = null;
	const outcome = await runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { data, error } = await supabase.rpc("resolve_room_pact", {
				p_nomination_id: input.nominationId,
				p_range: normalizePactRange(input.range),
				p_scheduled_at: input.scheduledAt ?? null,
			});
			if (error || !data) {
				return {
					ok: false,
					error: `No se pudo pactar en Sala: ${error?.message ?? ""}`,
				};
			}
			resolved = toApproveResult(data as unknown as PactRpcRow);
			if (resolved.status !== "agreed") {
				return { ok: false, error: "No se pudo pactar en Sala." };
			}
		},
		revalidate: () => [materialsPath(input.slug)],
	});
	if (!outcome.ok) return outcome;
	return { ok: true, data: resolved ?? undefined };
}

/**
 * Pacto asíncrono (#90): propone cualquiera sobre postulado activo.
 * Ventana de 7 días; el proponente cuenta como primera aprobación.
 */
export async function proposeMaterialPact(
	input: ProposeMaterialPactInput,
): Promise<ActionResult & { data?: ProposePactResult }> {
	let pactId: string | null = null;
	const outcome = await runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { data, error } = await supabase.rpc("propose_material_pact", {
				p_nomination_id: input.nominationId,
			});
			if (error || !data) {
				return {
					ok: false,
					error: `No se pudo proponer el pacto: ${error?.message ?? ""}`,
				};
			}
			pactId = data as unknown as string;
		},
		revalidate: () => [materialsPath(input.slug)],
	});
	if (!outcome.ok) return outcome;
	return { ok: true, data: pactId ? { pactId } : undefined };
}

/**
 * Aprobar pacto asíncrono (#90): mayoría simple dentro de la ventana
 * acuerda y resuelve; sin quórum al día 7 expira y cae a sorteo.
 */
export async function approveMaterialPact(
	input: ApproveMaterialPactInput,
): Promise<ActionResult & { data?: ApprovePactResult }> {
	let resolved: ApprovePactResult | null = null;
	const outcome = await runServerAction({
		requireAuth: true,
		run: async ({ supabase }) => {
			const { data, error } = await supabase.rpc("approve_material_pact", {
				p_pact_id: input.pactId,
			});
			if (error || !data) {
				return {
					ok: false,
					error: `No se pudo aprobar el pacto: ${error?.message ?? ""}`,
				};
			}
			resolved = toApproveResult(data as unknown as PactRpcRow);
		},
		revalidate: () => [materialsPath(input.slug)],
	});
	if (!outcome.ok) return outcome;
	return { ok: true, data: resolved ?? undefined };
}
