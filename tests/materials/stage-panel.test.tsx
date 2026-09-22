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
	it("al terminar el debate el moderador continúa a Cierre", async () => {
		const user = userEvent.setup();
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

		await user.click(
			screen.getByRole("button", { name: "Continuar a Cierre" }),
		);
		await waitFor(() => {
			expect(advanceRoomStage).toHaveBeenCalledWith("sess-1", "cierre");
		});
		expect(refresh).toHaveBeenCalled();
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
		expect(screen.getByText("Turno 1 de 2")).toBeTruthy();
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
});
