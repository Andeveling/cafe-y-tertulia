/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StagePanel } from "@/app/materials/_components/stage-panel";
import type { RoomDebateSnapshot } from "@/app/materials/_lib/room-types";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh, push: vi.fn() }),
}));

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/materials/_lib/room-actions", () => ({
	advanceRoomStage: vi.fn(async () => ({ ok: true })),
	castHeart: vi.fn(async () => ({ ok: true })),
	continueIntervention: vi.fn(async () => ({ ok: true })),
	extendExposition: vi.fn(async () => ({ ok: true })),
	revealNext: vi.fn(async () => ({ ok: true })),
}));

import {
	advanceRoomStage,
	continueIntervention,
	revealNext,
} from "@/app/materials/_lib/room-actions";

const active: RoomDebateSnapshot = {
	mode: "active",
	assignmentId: "a-1",
	state: "exposition",
	questionText: "¿Qué te movió?",
	assigneeName: "Luis",
	assigneeId: "m-2",
	assigneeAvatar: null,
	authorName: "Ana",
	authorAvatar: null,
	revealOrder: 1,
	myNotes: null,
	phaseStartedAt: "2026-01-03T00:00:00.000Z",
	hearts: null,
	remainingHidden: 0,
};

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("StagePanel", () => {
	it("al terminar el debate anuncia el cierre sin el avance (vive en el nav)", () => {
		render(
			<StagePanel
				debate={{ mode: "done", remainingHidden: 0 }}
				sessionId="sess-1"
				userId="m-1"
				isModerator
				next="cierre"
			/>,
		);

		expect(screen.getByText("Debate terminado")).toBeTruthy();
		expect(screen.getByText(/En Cierre se califica el material/)).toBeTruthy();
		expect(
			screen.queryByRole("button", { name: "Continuar a Cierre" }),
		).toBeNull();
	});

	it("quien no modera ve el cierre del debate sin el avance", async () => {
		render(
			<StagePanel
				debate={{ mode: "done", remainingHidden: 0 }}
				sessionId="sess-1"
				userId="m-2"
				isModerator={false}
				next="cierre"
			/>,
		);

		expect(screen.getByText("Debate terminado")).toBeTruthy();
		expect(
			screen.getByText(/cuando el moderador cierra la sesión/),
		).toBeTruthy();
		expect(screen.queryByRole("button", { name: /Continuar a/ })).toBeNull();
	});

	it("en la espera el moderador revela la pregunta del siguiente", async () => {
		const user = userEvent.setup();
		const debate: RoomDebateSnapshot = {
			mode: "waiting_reveal",
			nextAssigneeName: "Luis",
			nextAssigneeId: "m-2",
			nextAssigneeAvatar: null,
			revealOrder: 1,
			remainingHidden: 1,
		};
		render(
			<StagePanel
				debate={debate}
				sessionId="sess-1"
				userId="m-1"
				isModerator
				progress={{ current: 1, total: 2 }}
			/>,
		);

		expect(
			screen.getByRole("region", { name: "Pregunta sellada" }),
		).toBeTruthy();
		expect(screen.getByText("Intervención 1 de 2")).toBeTruthy();
		await user.click(
			screen.getByRole("button", {
				name: "Revelar pregunta 1 para Luis",
			}),
		);
		await waitFor(() => {
			expect(revealNext).toHaveBeenCalledWith("sess-1");
		});
	});

	it("en el turno activo el expositor oye que le toca y el moderador cierra la fase", async () => {
		const user = userEvent.setup();
		render(
			<StagePanel
				debate={active}
				sessionId="sess-1"
				userId="m-2"
				isModerator
				authorId="m-1"
				progress={{ current: 1, total: 2 }}
				members={[
					{
						memberId: "m-1",
						displayName: "Ana",
						avatar: null,
						role: "member",
						optOut: false,
					},
					{
						memberId: "m-2",
						displayName: "Luis",
						avatar: null,
						role: "member",
						optOut: false,
					},
				]}
				nextAssigneeName="Mia"
				nowMs={Date.parse("2026-01-03T00:00:30.000Z")}
			/>,
		);

		expect(screen.getByText("Te toca hablar.")).toBeTruthy();
		expect(screen.getByText("¿Qué te movió?")).toBeTruthy();
		expect(screen.getByText("Exposición")).toBeTruthy();
		expect(screen.getByText("Siguiente en exponer:")).toBeTruthy();

		const end = await screen.findByRole("button", {
			name: "Terminar exposición",
		});
		await user.click(end);
		await user.click(await screen.findByRole("button", { name: "Confirmar" }));
		await waitFor(() => {
			expect(continueIntervention).toHaveBeenCalledWith("sess-1");
		});
	});

	it("el expositor no ve el bloque de corazones de su propia exposición", () => {
		const debate: RoomDebateSnapshot = {
			...active,
			hearts: { myHeart: null, voted: 0, eligible: 1 },
		};
		render(
			<StagePanel
				debate={debate}
				sessionId="sess-1"
				userId="m-2"
				isModerator={false}
				authorId="m-1"
				members={[
					{
						memberId: "m-1",
						displayName: "Ana",
						avatar: null,
						role: "member",
						optOut: false,
					},
					{
						memberId: "m-2",
						displayName: "Luis",
						avatar: null,
						role: "member",
						optOut: false,
					},
				]}
				nowMs={Date.parse("2026-01-03T00:00:30.000Z")}
			/>,
		);

		expect(screen.queryByText("Cómo estuvo la exposición de Luis")).toBeNull();
		expect(screen.queryByRole("radiogroup")).toBeNull();
	});

	it("quien escucha ve el picker para calificar la exposición", () => {
		const debate: RoomDebateSnapshot = {
			...active,
			hearts: { myHeart: null, voted: 0, eligible: 1 },
		};
		render(
			<StagePanel
				debate={debate}
				sessionId="sess-1"
				userId="m-3"
				isModerator={false}
				authorId="m-1"
				members={[
					{
						memberId: "m-1",
						displayName: "Ana",
						avatar: null,
						role: "member",
						optOut: false,
					},
					{
						memberId: "m-2",
						displayName: "Luis",
						avatar: null,
						role: "member",
						optOut: false,
					},
					{
						memberId: "m-3",
						displayName: "Mia",
						avatar: null,
						role: "member",
						optOut: false,
					},
				]}
				nowMs={Date.parse("2026-01-03T00:00:30.000Z")}
			/>,
		);

		expect(screen.getByText("Cómo estuvo la exposición de Luis")).toBeTruthy();
		expect(
			screen.getByRole("radiogroup", {
				name: "Cómo estuvo la exposición de Luis",
			}),
		).toBeTruthy();
	});
});

describe("StagePanel · temporizador del turno", () => {
	const nowMs = Date.parse("2026-01-03T00:00:30.000Z");
	const members = [
		{
			memberId: "m-1",
			displayName: "Ana",
			avatar: null,
			role: "member" as const,
			optOut: false,
		},
		{
			memberId: "m-2",
			displayName: "Luis",
			avatar: null,
			role: "member" as const,
			optOut: false,
		},
		{
			memberId: "m-3",
			displayName: "Mia",
			avatar: null,
			role: "member" as const,
			optOut: false,
		},
	];

	it("en exposición quien no modera ve el temporizador en En la palabra y no los controles", () => {
		render(
			<StagePanel
				debate={active}
				sessionId="sess-1"
				userId="m-3"
				isModerator={false}
				authorId="m-1"
				members={members}
				nowMs={nowMs}
			/>,
		);

		const palabra = screen.getByRole("region", { name: "En la palabra" });
		expect(palabra.textContent).toContain("4:30");
		expect(
			screen.queryByRole("button", { name: "Terminar exposición" }),
		).toBeNull();
		expect(screen.queryByRole("button", { name: /Sumar 1 minuto/ })).toBeNull();
	});

	it("en complemento quien no modera ve el temporizador en En la palabra", () => {
		render(
			<StagePanel
				debate={{ ...active, state: "complement" }}
				sessionId="sess-1"
				userId="m-2"
				isModerator={false}
				authorId="m-1"
				members={members}
				nowMs={nowMs}
			/>,
		);

		const palabra = screen.getByRole("region", { name: "En la palabra" });
		expect(palabra.textContent).toContain("0:30");
		expect(
			screen.queryByRole("button", { name: "Terminar complemento" }),
		).toBeNull();
	});

	it("en exposición el moderador ve los controles y el temporizador una sola vez", () => {
		render(
			<StagePanel
				debate={active}
				sessionId="sess-1"
				userId="m-1"
				isModerator
				authorId="m-1"
				members={members}
				nowMs={nowMs}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Terminar exposición" }),
		).toBeTruthy();
		expect(screen.getByRole("button", { name: /Sumar 1 minuto/ })).toBeTruthy();
		expect(screen.getAllByText("4:30")).toHaveLength(1);
		expect(
			screen.getByRole("region", { name: "En la palabra" }).textContent,
		).toContain("4:30");
	});

	it("en complemento el moderador ve los controles y el temporizador, sin sumar minutos", () => {
		render(
			<StagePanel
				debate={{ ...active, state: "complement" }}
				sessionId="sess-1"
				userId="m-1"
				isModerator
				authorId="m-1"
				members={members}
				nowMs={nowMs}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Terminar complemento" }),
		).toBeTruthy();
		expect(screen.queryByRole("button", { name: /Sumar 1 minuto/ })).toBeNull();
		expect(screen.getAllByText("0:30")).toHaveLength(1);
		expect(
			screen.getByRole("region", { name: "En la palabra" }).textContent,
		).toContain("0:30");
	});
});
