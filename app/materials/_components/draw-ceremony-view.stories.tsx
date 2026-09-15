import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { expect, fn, userEvent } from "storybook/test";
import { Button } from "@/components/ui/button";
import {
	DRAW_COUNTDOWN_MS,
	DRAW_FANFARE_MS,
	DRAW_STAGGER_MS,
} from "../_lib/draw-ceremony";
import type { RoomAssignment } from "../_lib/room-types";
import { DrawCeremonyView } from "./draw-ceremony-view";

const T0 = Date.parse("2026-09-07T15:00:00.000Z");
const createdAt = "2026-09-07T15:00:00.000Z";

const pairs: RoomAssignment[] = [
	{
		assignmentId: "a1",
		questionId: "q1",
		authorId: "u-ana",
		assigneeId: "u-andres",
		authorName: "Ana",
		assigneeName: "Andrés",
		state: "hidden",
		revealOrder: 1,
		questionText: null,
		questionVisible: false,
	},
	{
		assignmentId: "a2",
		questionId: "q2",
		authorId: "u-andres",
		assigneeId: "u-ana",
		authorName: "Andrés",
		assigneeName: "Ana",
		state: "hidden",
		revealOrder: 2,
		questionText: null,
		questionVisible: false,
	},
];

const readiness = { total: 2, ready: 2, allReady: true };

const people = [
	{ id: "u-ana", name: "Ana" },
	{ id: "u-andres", name: "Andrés" },
];

const meta = {
	title: "Sala/Sorteo",
	component: DrawCeremonyView,
	tags: ["autodocs"],
	args: {
		done: false,
		createdAt: null,
		assignments: [],
		readiness,
		people,
		userId: "u-andres",
		isModerator: true,
		pending: false,
		onExecute: fn(),
		reducedMotion: true,
	},
} satisfies Meta<typeof DrawCeremonyView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WaitingModerator: Story = {
	play: async ({ canvas, args }) => {
		await expect(
			canvas.getByRole("button", { name: /sortear/i }),
		).toBeVisible();
		await userEvent.click(canvas.getByRole("button", { name: /sortear/i }));
		await expect(args.onExecute).toHaveBeenCalled();
	},
};

export const WaitingMember: Story = {
	args: { isModerator: false },
};

export const Countdown: Story = {
	args: {
		done: true,
		createdAt,
		assignments: pairs,
		nowMs: T0 + 100,
		reducedMotion: false,
	},
	play: async ({ canvas }) => {
		await expect(
			canvas.getByRole("img", { name: /rueda del sorteo girando/i }),
		).toBeVisible();
		await expect(canvas.getByText("La rueda gira")).toBeVisible();
	},
};

export const Fanfare: Story = {
	args: {
		done: true,
		createdAt,
		assignments: pairs,
		nowMs: T0 + 3200,
		reducedMotion: false,
	},
};

export const SettledYours: Story = {
	args: {
		done: true,
		createdAt,
		assignments: pairs,
		nowMs: T0 + 20_000,
		reducedMotion: true,
	},
	play: async ({ canvas }) => {
		await expect(canvas.getByText("Tú expones")).toBeVisible();
		await expect(canvas.getByText("Ana")).toBeVisible();
		await expect(canvas.getByText("Orden de intervención")).toBeVisible();
		await expect(canvas.getByText("Tú")).toBeVisible();
	},
};

export const SettledWitness: Story = {
	args: {
		done: true,
		createdAt,
		assignments: pairs,
		userId: "u-mira",
		nowMs: T0 + 20_000,
		reducedMotion: true,
	},
};

/**
 * Reloj optimista: llegó el created_at del evento realtime pero aún no el
 * snapshot (sin asignaciones). Cuenta 3-2-1 igual y congela en fanfarria.
 */
export const OptimisticCountdown: Story = {
	tags: ["!test"],
	args: {
		done: true,
		createdAt,
		assignments: [],
		nowMs: T0 + 100,
		reducedMotion: false,
		optimistic: true,
	},
};

const CEREMONY_MS =
	DRAW_COUNTDOWN_MS + DRAW_FANFARE_MS + DRAW_STAGGER_MS * pairs.length + 800;

function LiveClock({ userId }: { userId: string }) {
	const [nowMs, setNowMs] = useState(T0);

	useEffect(() => {
		const start = performance.now();
		let raf = 0;
		const tick = (t: number) => {
			const elapsed = t - start;
			setNowMs(T0 + elapsed);
			if (elapsed < CEREMONY_MS) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, []);

	return (
		<DrawCeremonyView
			done
			createdAt={createdAt}
			assignments={pairs}
			readiness={readiness}
			people={people}
			userId={userId}
			isModerator={false}
			nowMs={nowMs}
			reducedMotion={false}
		/>
	);
}

function LivePlay({ userId = "u-andres" }: { userId?: string }) {
	const [run, setRun] = useState(0);

	return (
		<div className="dark mx-auto flex min-h-svh max-w-lg flex-col gap-6 bg-background p-8 text-foreground">
			<LiveClock key={run} userId={userId} />
			<Button variant="outline" onClick={() => setRun((n) => n + 1)}>
				Repetir
			</Button>
		</div>
	);
}

/** Reloj propio (performance.now) — Storybook congela Date con MockDate. */
export const PlayLive: Story = {
	tags: ["!test"],
	parameters: { layout: "fullscreen" },
	render: () => <LivePlay />,
};
