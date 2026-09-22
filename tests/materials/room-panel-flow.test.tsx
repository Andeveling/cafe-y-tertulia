/**
 * @vitest-environment jsdom
 */
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	advanceRoomStage,
	advanceToDraw,
	confirmPresence,
	setSpectator,
	transferModerator,
} from "@/app/materials/_lib/room-actions";
import {
	member,
	question,
	RoomPanel,
	renderPanel,
	snapshot,
} from "./room-panel-harness";

const liveState = vi.hoisted(() => ({ value: true }));
const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh, push: vi.fn() }),
}));

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/app/materials/_hooks/use-room-realtime", () => ({
	useRoomRealtime: () => ({ live: liveState.value }),
	announceMemberLeft: vi.fn(async () => {}),
}));

vi.mock("@/hooks/use-club-presence", () => ({
	useClubPresence: () => [],
}));

vi.mock("@/app/materials/_lib/room-actions", () => ({
	advanceRoomStage: vi.fn(async () => ({ ok: true })),
	advanceToDraw: vi.fn(async () => ({ ok: true })),
	confirmPresence: vi.fn(async () => ({ ok: true })),
	deleteQuestion: vi.fn(async () => ({ ok: true })),
	editQuestion: vi.fn(async () => ({ ok: true })),
	ensureRoomSeat: vi.fn(async () => ({ ok: true })),
	executeDraw: vi.fn(async () => ({ ok: true })),
	saveQuestion: vi.fn(async () => ({ ok: true })),
	setSpectator: vi.fn(async () => ({ ok: true })),
	toggleOptOut: vi.fn(async () => ({ ok: true })),
	transferModerator: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/app/materials/_components/draw-ceremony", () => ({
	DrawCeremony: () => <p>Ceremonia del sorteo</p>,
}));

vi.mock("@/app/materials/_components/stage-panel", () => ({
	StagePanel: () => <p>Escenario del debate</p>,
}));

vi.mock("@/app/materials/_components/debate-tools-tray", () => ({
	DebateToolsTray: () => <p>Bandeja de la tertulia</p>,
}));

vi.mock("@/app/materials/_components/cierre-stage", () => ({
	CierreStage: () => <p>Cierre de la tertulia</p>,
}));

vi.mock("@/app/materials/_components/presence-invite", () => ({
	PresenceInvite: () => <p>Invitar a la sala</p>,
}));

afterEach(() => {
	cleanup();
});

beforeEach(() => {
	liveState.value = true;
	vi.clearAllMocks();
});

describe("RoomPanel", () => {
	it("en Presentes confirma asistencia, invita y cede la mesa", async () => {
		const user = userEvent.setup();
		renderPanel({
			roomStage: "presence",
			participants: [],
			readiness: { total: 0, ready: 0, allReady: false },
		});
		await user.click(
			screen.getByRole("button", { name: "Confirmar asistencia" }),
		);
		await waitFor(() => {
			expect(confirmPresence).toHaveBeenCalledWith("sess-1");
		});

		cleanup();
		renderPanel({
			roomStage: "presence",
			participants: [
				member("m-1", "Ana"),
				member("m-2", "Luis"),
				member("m-3", "Mia", "spectator"),
			],
			questions: [question("q-1", "m-1", "Una", true)],
			readiness: { total: 2, ready: 1, allReady: false },
		});

		expect(screen.getByText("1/2 listos")).toBeTruthy();
		expect(screen.getByText("Invitar a la sala")).toBeTruthy();
		expect(screen.getByText(/Espectadores · Mia/)).toBeTruthy();

		await user.click(screen.getByRole("button", { name: "A espectador" }));
		await user.click(
			screen.getByRole("button", { name: "Pasar a espectador" }),
		);
		await waitFor(() => {
			expect(setSpectator).toHaveBeenCalledWith("sess-1", "m-2", true);
		});

		await user.click(screen.getByRole("button", { name: "Ceder moderación" }));
		await waitFor(() => {
			expect(transferModerator).toHaveBeenCalledWith("sess-1", "m-2");
		});

		await user.click(screen.getByRole("button", { name: "Retirar" }));
		await waitFor(() => {
			expect(setSpectator).toHaveBeenCalledWith("sess-1", "m-3", false);
		});
	});

	it("avisa cuando alguien se une o queda listo, salvo uno mismo", async () => {
		const { rerender } = renderPanel(
			{
				roomStage: "presence",
				participants: [member("m-1", "Ana")],
				readiness: { total: 1, ready: 0, allReady: false },
			},
			{ userId: "m-1" },
		);

		rerender(
			<RoomPanel
				snapshot={snapshot({
					roomStage: "presence",
					participants: [member("m-1", "Ana"), member("m-2", "Luis")],
					readiness: { total: 2, ready: 0, allReady: false },
				})}
				userId="m-1"
				isModerator
				rating={null}
			/>,
		);
		expect(toast.success).toHaveBeenCalledWith("Luis se unió");

		rerender(
			<RoomPanel
				snapshot={snapshot({
					roomStage: "presence",
					participants: [member("m-1", "Ana"), member("m-2", "Luis")],
					questions: [question("q-2", "m-2", null, false)],
					readiness: { total: 2, ready: 1, allReady: false },
				})}
				userId="m-1"
				isModerator
				rating={null}
			/>,
		);
		expect(toast.success).toHaveBeenCalledWith("Luis está listo");
	});

	it("entrar a Sorteo sortea una sola vez", async () => {
		const user = userEvent.setup();
		renderPanel({
			roomStage: "presence",
			participants: [member("m-1", "Ana"), member("m-2", "Luis")],
			readiness: { total: 2, ready: 2, allReady: true },
			draw: { done: false, status: null, createdAt: null },
		});

		await user.click(
			screen.getByRole("button", { name: "Continuar a Sorteo" }),
		);
		await waitFor(() => {
			expect(advanceToDraw).toHaveBeenCalledWith("sess-1");
		});
		expect(advanceRoomStage).not.toHaveBeenCalled();

		cleanup();
		vi.clearAllMocks();
		renderPanel({
			roomStage: "presence",
			participants: [member("m-1", "Ana"), member("m-2", "Luis")],
			readiness: { total: 2, ready: 2, allReady: true },
			draw: { done: true, status: "revealed", createdAt: "2026-01-02" },
		});
		await user.click(
			screen.getByRole("button", { name: "Continuar a Sorteo" }),
		);
		await waitFor(() => {
			expect(advanceRoomStage).toHaveBeenCalledWith("sess-1", "draw");
		});
		expect(advanceToDraw).not.toHaveBeenCalled();
	});

	it("sin miembros en la mesa el avance queda bloqueado", () => {
		renderPanel({
			roomStage: "presence",
			participants: [member("m-3", "Mia", "spectator")],
			readiness: { total: 0, ready: 0, allReady: false },
		});

		expect(
			screen.getByRole("button", { name: "Continuar a Sorteo" }),
		).toHaveProperty("disabled", true);
		expect(
			screen.getByText("Se necesita al menos un participante para avanzar."),
		).toBeTruthy();
	});

	it("en Sorteo compone la ceremonia y permite volver a Presentes", async () => {
		const user = userEvent.setup();
		renderPanel({
			roomStage: "draw",
			participants: [member("m-1", "Ana"), member("m-2", "Luis")],
		});

		expect(screen.getByText("Ceremonia del sorteo")).toBeTruthy();
		await user.click(
			screen.getByRole("button", { name: "Volver a Presentes" }),
		);
		await waitFor(() => {
			expect(advanceRoomStage).toHaveBeenCalledWith("sess-1", "presence");
		});
	});

	it("de Sorteo a Debate no pide preguntas pendientes", async () => {
		const user = userEvent.setup();
		renderPanel({
			roomStage: "draw",
			participants: [member("m-1", "Ana"), member("m-2", "Tertuliano Test")],
			questions: [question("q-1", "m-1", "¿Qué te movió?", true)],
		});

		await user.click(
			screen.getByRole("button", { name: "Continuar a Debate" }),
		);
		expect(screen.queryByText("Pendientes:")).toBeNull();
		expect(screen.queryByText("Tertuliano Test")).toBeNull();
		await waitFor(() => {
			expect(advanceRoomStage).toHaveBeenCalledWith("sess-1", "debate");
		});
	});

	it("en Debate compone el escenario y la bandeja, y confirma el regreso", async () => {
		const user = userEvent.setup();
		renderPanel(
			{
				roomStage: "debate",
				draw: { done: true, status: "revealed", createdAt: "2026-01-02" },
				assignments: [
					{
						assignmentId: "a-1",
						questionId: "q-1",
						authorId: "m-1",
						assigneeId: "m-2",
						authorName: "Ana",
						assigneeName: "Luis",
						authorAvatar: null,
						assigneeAvatar: null,
						state: "exposition",
						revealOrder: 0,
						questionText: "¿Qué?",
						questionVisible: true,
						aprecioExpositionAvg: null,
						aprecioExpositionCount: 0,
						aprecioComplementAvg: null,
						aprecioComplementCount: 0,
					},
				],
				debate: {
					mode: "active",
					assignmentId: "a-1",
					state: "exposition",
					questionText: "¿Qué?",
					assigneeName: "Luis",
					assigneeId: "m-2",
					assigneeAvatar: null,
					authorName: "Ana",
					authorAvatar: null,
					revealOrder: 0,
					myNotes: null,
					phaseStartedAt: "2026-01-03",
					hearts: null,
					remainingHidden: 0,
				},
			},
			{
				minigameState: {
					liveRoundId: null,
					lastBoardRoundId: null,
					openTakeId: null,
					bank: [],
					takes: [],
					triviaRoundCount: 0,
					takeCount: 0,
				},
			},
		);

		expect(screen.getByText("Escenario del debate")).toBeTruthy();
		expect(screen.getByText("Bandeja de la tertulia")).toBeTruthy();

		await user.click(screen.getByRole("button", { name: "Volver a Sorteo" }));
		expect(
			screen.getByText("Los turnos ya revelados quedan como están."),
		).toBeTruthy();
		await user.click(
			screen.getByRole("button", { name: "Volver de todos modos" }),
		);
		await waitFor(() => {
			expect(advanceRoomStage).toHaveBeenCalledWith("sess-1", "draw");
		});
	});

	it("pide confirmación si quedan turnos antes de Cierre", async () => {
		const user = userEvent.setup();
		renderPanel({
			roomStage: "debate",
			draw: { done: true, status: "revealed", createdAt: "2026-01-02" },
			assignments: [
				{
					assignmentId: "a-1",
					questionId: "q-1",
					authorId: "m-1",
					assigneeId: "m-2",
					authorName: "Ana",
					assigneeName: "Luis",
					authorAvatar: null,
					assigneeAvatar: null,
					state: "exposition",
					revealOrder: 1,
					questionText: "¿Qué?",
					questionVisible: true,
					aprecioExpositionAvg: null,
					aprecioExpositionCount: 0,
					aprecioComplementAvg: null,
					aprecioComplementCount: 0,
				},
			],
			debate: {
				mode: "active",
				assignmentId: "a-1",
				state: "exposition",
				questionText: "¿Qué?",
				assigneeName: "Luis",
				assigneeId: "m-2",
				assigneeAvatar: null,
				authorName: "Ana",
				authorAvatar: null,
				revealOrder: 1,
				myNotes: null,
				phaseStartedAt: "2026-01-03",
				hearts: null,
				remainingHidden: 0,
			},
		});

		await user.click(
			screen.getByRole("button", { name: "Continuar a Cierre" }),
		);
		expect(screen.getByText("1 turno(s) sin completar")).toBeTruthy();
		await user.click(
			screen.getByRole("button", { name: "Avanzar de todos modos" }),
		);
		await waitFor(() => {
			expect(advanceRoomStage).toHaveBeenCalledWith("sess-1", "cierre");
		});
	});

	it("al terminar el debate esconde la nav y en Cierre compone el cierre", () => {
		const { rerender } = renderPanel({
			roomStage: "debate",
			debate: { mode: "done", remainingHidden: 0 },
			draw: { done: true, status: "revealed", createdAt: "2026-01-02" },
		});
		expect(screen.queryByRole("button", { name: /Continuar a/ })).toBeNull();
		expect(screen.queryByRole("button", { name: /Volver a/ })).toBeNull();

		rerender(
			<RoomPanel
				snapshot={snapshot({
					roomStage: "cierre",
					cierre: { openTrivia: 0, openTakes: 0 },
					debate: null,
				})}
				userId="m-1"
				isModerator
				rating={null}
			/>,
		);
		expect(screen.getByText("Cierre de la tertulia")).toBeTruthy();
		expect(screen.queryByRole("button", { name: /Continuar a/ })).toBeNull();
	});
});
