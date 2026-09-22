/**
 * @vitest-environment jsdom
 */
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	advanceRoomStage,
	deleteQuestion,
	editQuestion,
	ensureRoomSeat,
	saveQuestion,
	setSpectator,
	toggleOptOut,
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
	it("muestra En vivo cuando el canal de la sala está suscrito", () => {
		renderPanel();
		expect(screen.getByRole("status").textContent).toContain("En vivo");
	});

	it("al reconectar, Reintentar refresca el árbol del servidor", async () => {
		liveState.value = false;
		const user = userEvent.setup();
		renderPanel();

		expect(screen.getByRole("status").textContent).toContain("Reconectando…");
		await user.click(screen.getByRole("button", { name: "Reintentar" }));

		expect(refresh).toHaveBeenCalledOnce();
	});

	it("en el lobby sienta a quien abre Preguntas sin fila", async () => {
		renderPanel(
			{
				status: "lobby",
				participants: [member("m-2", "Luis")],
				moderatorId: "m-2",
			},
			{ userId: "m-1", isModerator: false },
		);

		await waitFor(() => {
			expect(ensureRoomSeat).toHaveBeenCalledWith("sess-1");
		});
	});

	it("envía la pregunta escrita y la cuenta como enviada", async () => {
		const user = userEvent.setup();
		renderPanel({ questions: [] }, { isModerator: false, userId: "m-2" });

		await user.type(
			screen.getByPlaceholderText(
				"¿Qué pregunta quieres hacer sobre el material?",
			),
			"  ¿Por qué duele?  ",
		);
		await user.click(screen.getByRole("button", { name: "Enviar pregunta" }));

		await waitFor(() => {
			expect(saveQuestion).toHaveBeenCalledWith(
				"sess-1",
				"mat-1",
				"¿Por qué duele?",
			);
		});
		expect(toast.success).toHaveBeenCalledWith("Pregunta 1 enviada");
		expect(refresh).toHaveBeenCalled();
	});

	it("guarda la corrección de una pregunta propia", async () => {
		const user = userEvent.setup();
		renderPanel({
			questions: [question("q-1", "m-1", "Texto viejo", true)],
		});

		await user.click(screen.getByRole("button", { name: "Editar pregunta" }));
		const editor = screen.getByDisplayValue("Texto viejo");
		await user.clear(editor);
		await user.type(editor, "Texto nuevo");
		await user.click(screen.getByRole("button", { name: "Guardar" }));

		await waitFor(() => {
			expect(editQuestion).toHaveBeenCalledWith("q-1", "sess-1", "Texto nuevo");
		});
		expect(toast.success).toHaveBeenCalledWith("Pregunta actualizada");
	});

	it("borra una pregunta propia tras confirmar", async () => {
		const user = userEvent.setup();
		renderPanel({
			questions: [question("q-9", "m-1", "Para borrar", true)],
		});

		await user.click(screen.getByRole("button", { name: "Borrar pregunta" }));
		await user.click(screen.getByRole("button", { name: "Borrar" }));

		await waitFor(() => {
			expect(deleteQuestion).toHaveBeenCalledWith("q-9", "sess-1");
		});
		expect(toast.success).toHaveBeenCalledWith("Pregunta borrada");
	});

	it("deja ser espectador solo con mesa mínima y vuelve al sorteo", async () => {
		const user = userEvent.setup();
		const { rerender } = renderPanel({
			participants: [member("m-1", "Ana"), member("m-2", "Luis")],
			questions: [question("q-1", "m-1", "Una", true)],
		});

		expect(
			screen.getByRole("button", { name: "Soy espectador" }),
		).toHaveProperty("disabled", true);

		rerender(
			<RoomPanel
				snapshot={snapshot({
					participants: [
						member("m-1", "Ana"),
						member("m-2", "Luis"),
						member("m-3", "Mia"),
					],
					questions: [
						question("q-1", "m-1", "Una", true),
						question("q-2", "m-2", null, false),
					],
				})}
				userId="m-1"
				isModerator
				rating={null}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Soy espectador" }));
		await waitFor(() => {
			expect(toggleOptOut).toHaveBeenCalledWith("sess-1", false);
		});
		expect(toast.success).toHaveBeenCalledWith("Vas como espectador");

		cleanup();
		renderPanel({
			participants: [
				member("m-1", "Ana", "member", true),
				member("m-2", "Luis"),
				member("m-3", "Mia"),
			],
			questions: [
				question("q-1", "m-1", "Una", true),
				question("q-2", "m-2", null, false),
			],
		});
		await user.click(
			screen.getByRole("button", { name: "Volver a participar del sorteo" }),
		);
		await waitFor(() => {
			expect(toggleOptOut).toHaveBeenCalledWith("sess-1", true);
		});
		expect(toast.success).toHaveBeenCalledWith("Vuelves al sorteo");
	});

	it("en Preguntas el moderador avanza desde la revisión, no desde la nav genérica", async () => {
		const user = userEvent.setup();
		renderPanel({
			participants: [
				member("m-1", "Ana"),
				member("m-2", "Luis"),
				member("m-3", "Mia"),
			],
			questions: [
				question("q-1", "m-1", "Una", true),
				question("q-2", "m-2", null, false),
			],
		});

		expect(screen.queryByRole("button", { name: /Continuar a/ })).toBeNull();
		expect(
			screen.getByText("Faltan 1: ¿esperamos o entran mirando?"),
		).toBeTruthy();

		await user.click(screen.getByRole("button", { name: "Entra mirando" }));
		await user.click(
			screen.getByRole("button", { name: "Avisar y avanzar a Presentes" }),
		);

		await waitFor(() => {
			expect(setSpectator).toHaveBeenCalledWith("sess-1", "m-3", true);
			expect(advanceRoomStage).toHaveBeenCalledWith("sess-1", "presence");
		});
		expect(vi.mocked(setSpectator).mock.invocationCallOrder[0]).toBeLessThan(
			vi.mocked(advanceRoomStage).mock.invocationCallOrder[0],
		);
	});

	it("si pasar a espectador falla, no avanza de etapa", async () => {
		vi.mocked(setSpectator).mockResolvedValueOnce({
			ok: false,
			error: "No se pudo",
		});
		const user = userEvent.setup();
		renderPanel({
			participants: [
				member("m-1", "Ana"),
				member("m-2", "Luis"),
				member("m-3", "Mia"),
			],
			questions: [
				question("q-1", "m-1", "Una", true),
				question("q-2", "m-2", null, false),
			],
		});

		await user.click(screen.getByRole("button", { name: "Entra mirando" }));
		await user.click(
			screen.getByRole("button", { name: "Avisar y avanzar a Presentes" }),
		);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("No se pudo");
		});
		expect(advanceRoomStage).not.toHaveBeenCalled();
		expect(refresh).not.toHaveBeenCalled();
	});
});
