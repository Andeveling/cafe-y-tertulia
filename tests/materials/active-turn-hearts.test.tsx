/**
 * @vitest-environment jsdom
 *
 * La persona evaluada no ve el bloque de corazones en su turno — ni picker
 * ni texto — igual que antes no veía corazones. Quien sí puede votar ve el
 * picker con el label de qué se puntúa (exposición → la exposición,
 * complemento → la pregunta).
 */
import { cleanup, render, screen } from "@testing-library/react";
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

const NOW = Date.parse("2026-01-03T00:00:30.000Z");

function debate(
	state: "exposition" | "complement",
): RoomDebateSnapshot {
	return {
		mode: "active",
		assignmentId: "a-1",
		state,
		questionText: "¿Qué te movió?",
		assigneeName: "Luis",
		assigneeId: "m-2",
		assigneeAvatar: null,
		authorName: "Ana",
		authorAvatar: null,
		revealOrder: 1,
		myNotes: null,
		phaseStartedAt: "2026-01-03T00:00:00.000Z",
		hearts: { myHeart: null, voted: 1, eligible: 2 },
		remainingHidden: 0,
	};
}

const MEMBERS = [
	{ memberId: "m-1", displayName: "Ana", avatar: null as null, role: "member" as const, optOut: false },
	{ memberId: "m-2", displayName: "Luis", avatar: null as null, role: "member" as const, optOut: false },
];

function renderTurn(state: "exposition" | "complement", userId: string) {
	return render(
		<StagePanel
			debate={debate(state)}
			sessionId="sess-1"
			userId={userId}
			isModerator={false}
			authorId="m-1"
			progress={{ current: 1, total: 2 }}
			members={MEMBERS}
			nextAssigneeName="Mia"
			nowMs={NOW}
		/>,
	);
}

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("ActiveTurn · bloque de corazones", () => {
	it("en exposición el autor vota con label a la exposición", () => {
		renderTurn("exposition", "m-1");
		expect(
			screen.getByRole("radiogroup", {
				name: "Cómo estuvo la exposición de Luis",
			}),
		).toBeTruthy();
		expect(screen.getAllByRole("radio").length).toBe(5);
		expect(screen.queryByText(/Califica de/)).toBeNull();
	});

	it("en exposición el expositor no ve ni picker ni texto", () => {
		renderTurn("exposition", "m-2");
		expect(screen.queryByRole("radiogroup")).toBeNull();
		expect(screen.queryByText(/Cómo estuvo/)).toBeNull();
		expect(screen.queryByText(/Califica de 1 a 5 corazones/)).toBeNull();
	});

	it("en complemento el expositor vota con label a la pregunta", () => {
		renderTurn("complement", "m-2");
		expect(
			screen.getByRole("radiogroup", {
				name: "Cómo estuvo la pregunta de Ana",
			}),
		).toBeTruthy();
		expect(screen.queryByText(/Califica de/)).toBeNull();
	});

	it("en complemento el autor no ve ni picker ni texto", () => {
		renderTurn("complement", "m-1");
		expect(screen.queryByRole("radiogroup")).toBeNull();
		expect(screen.queryByText(/Cómo estuvo/)).toBeNull();
		expect(screen.queryByText(/Califica de 1 a 5 corazones/)).toBeNull();
	});
});
