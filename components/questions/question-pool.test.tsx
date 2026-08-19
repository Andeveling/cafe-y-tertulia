// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuestionPool } from "@/components/questions/question-pool";
import type { QuestionWithAuthor } from "@/lib/questions";

vi.mock("@/lib/actions/questions", () => ({
	createQuestionAction: vi.fn(),
	toggleOutsideDrawAction: vi.fn(),
}));

const sessionId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const materialId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const questions: QuestionWithAuthor[] = [
	{
		id: "q1",
		sessionId,
		materialId,
		authorId: "11111111-1111-1111-1111-111111111111",
		text: "¿Qué opinas del capítulo 2?",
		outsideDraw: false,
		createdAt: "2026-08-19T10:00:00Z",
		authorName: "Autor",
	},
	{
		id: "q2",
		sessionId,
		materialId,
		authorId: "22222222-2222-2222-2222-222222222222",
		text: "¿Y del final?",
		outsideDraw: true,
		createdAt: "2026-08-19T11:00:00Z",
		authorName: "Moderador",
	},
];

describe("QuestionPool", () => {
	it("muestra el pool con autor y marca 'Fuera de sorteo'", () => {
		render(
			<QuestionPool
				questions={questions}
				sessionId={sessionId}
				materialId={materialId}
				sessionRange="Capítulos 1-3"
				currentUserId="33333333-3333-3333-3333-333333333333"
				isModerator={false}
			/>,
		);

		expect(screen.getByText("¿Qué opinas del capítulo 2?")).toBeInTheDocument();
		expect(screen.getByText("¿Y del final?")).toBeInTheDocument();
		expect(screen.getByText(/Aportada por Autor/)).toBeInTheDocument();
		expect(screen.getByText("Fuera de sorteo")).toBeInTheDocument();
	});

	it("muestra el formulario para aportar una pregunta", () => {
		render(
			<QuestionPool
				questions={questions}
				sessionId={sessionId}
				materialId={materialId}
				sessionRange="Capítulos 1-3"
				currentUserId="33333333-3333-3333-3333-333333333333"
				isModerator={false}
			/>,
		);

		expect(
			screen.getByRole("textbox", { name: /aporta una pregunta/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /aportar/i }),
		).toBeInTheDocument();
	});

	it("no muestra el toggle de 'Fuera de sorteo' a un no-moderador", () => {
		render(
			<QuestionPool
				questions={questions}
				sessionId={sessionId}
				materialId={materialId}
				sessionRange="Capítulos 1-3"
				currentUserId="33333333-3333-3333-3333-333333333333"
				isModerator={false}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: /marcar fuera de sorteo/i }),
		).not.toBeInTheDocument();
	});

	it("muestra el toggle de 'Fuera de sorteo' al moderador", () => {
		render(
			<QuestionPool
				questions={questions}
				sessionId={sessionId}
				materialId={materialId}
				sessionRange="Capítulos 1-3"
				currentUserId="22222222-2222-2222-2222-222222222222"
				isModerator
			/>,
		);

		expect(screen.getAllByRole("switch").length).toBe(questions.length);
	});

	it("envía el formulario con el texto y la sesión", async () => {
		const user = userEvent.setup();
		const { createQuestionAction } = await import("@/lib/actions/questions");
		vi.mocked(createQuestionAction).mockResolvedValue({ ok: true });

		render(
			<QuestionPool
				questions={[]}
				sessionId={sessionId}
				materialId={materialId}
				sessionRange="Capítulos 1-3"
				currentUserId="33333333-3333-3333-3333-333333333333"
				isModerator={false}
			/>,
		);

		await user.type(
			screen.getByRole("textbox", { name: /aporta una pregunta/i }),
			"¿Qué opinas del capítulo 3?",
		);
		await user.click(screen.getByRole("button", { name: /aportar/i }));

		expect(createQuestionAction).toHaveBeenCalledTimes(1);
		const fd = vi.mocked(createQuestionAction).mock.calls[0]?.[1] as FormData;
		expect(fd.get("session_id")).toBe(sessionId);
		expect(fd.get("material_id")).toBe(materialId);
		expect(fd.get("text")).toBe("¿Qué opinas del capítulo 3?");
	});
});
