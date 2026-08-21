"use client";

// PROTOTIPO DESCARTABLE — tres variantes de la experiencia lobby → debate,
// simulando en memoria el ciclo completo (confirmar presencia → Sorteo oculto
// → comenzar debate). No muta el backend: todas las acciones son locales.
// Se monta solo con ?variant=A|B|C y fuera de producción.

import {
	ArrowLeft02Icon,
	ArrowRight01Icon,
	CheckmarkCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { LobbySnapshot } from "@/app/materials/_lib/lobby";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

// ── Estado simulado ─────────────────────────────────────────────────────────

type Phase = "arriving" | "drawn" | "live";

type Sim = {
	phase: Phase;
	present: { memberId: string; displayName: string; optOut: boolean }[];
	mePresent: boolean;
	meOptOut: boolean;
	drawDone: boolean;
	feed: string[];
};

function useLobbySim(
	lobby: LobbySnapshot,
	myName: string,
	startAsMod: boolean,
) {
	const [sim, setSim] = useState<Sim>({
		phase: "arriving",
		present: [...lobby.participants],
		mePresent: lobby.participants.some((p) => p.displayName === myName),
		meOptOut: false,
		drawDone: false,
		feed: ["Sesión abierta en lobby"],
	});
	const [role, setRole] = useState<"moderator" | "member">(
		startAsMod ? "moderator" : "member",
	);

	const log =
		(msg: string) =>
		(s: Sim): Sim => ({ ...s, feed: [...s.feed, msg] });

	const imPresent = () =>
		setSim((s) =>
			log("Confirmaste presencia")({
				...s,
				mePresent: true,
				present: s.present.some((p) => p.displayName === myName)
					? s.present
					: [
							...s.present,
							{ memberId: "me", displayName: myName, optOut: false },
						],
			}),
		);
	const toggleOptOut = () =>
		setSim((s) =>
			log(s.meOptOut ? "Volviste al sorteo" : "Marcaste Sin sorteo")({
				...s,
				meOptOut: !s.meOptOut,
				present: s.present.map((p) =>
					p.displayName === myName ? { ...p, optOut: !s.meOptOut } : p,
				),
			}),
		);
	const someoneArrives = () => {
		const names = ["Ana", "Luis", "Marta", "Pedro"];
		setSim((s) => {
			const name = names[s.present.length % names.length];
			return log(`${name} confirmó presencia`)({
				...s,
				present: [
					...s.present,
					{ memberId: `sim-${name}`, displayName: name, optOut: false },
				],
			});
		});
	};
	const runDraw = () =>
		setSim((s) =>
			log("Sorteo ejecutado · oculto para todos")({ ...s, drawDone: true }),
		);
	const startDebate = () =>
		setSim((s) => log("El debate comenzó")({ ...s, phase: "live" }));
	const reset = () =>
		setSim({
			phase: "arriving",
			present: [...lobby.participants],
			mePresent: lobby.participants.some((p) => p.displayName === myName),
			meOptOut: false,
			drawDone: false,
			feed: ["Sesión abierta en lobby"],
		});

	return {
		sim,
		role,
		setRole,
		imPresent,
		toggleOptOut,
		someoneArrives,
		runDraw,
		startDebate,
		reset,
	};
}

// ── Piezas compartidas ligeras ──────────────────────────────────────────────

const PHASE_LABEL: Record<Phase, string> = {
	arriving: "Llegando",
	drawn: "Sorteo listo",
	live: "En debate",
};

function PresenceDots({
	present,
	moderatorName,
}: {
	present: Sim["present"];
	moderatorName: string | null;
}) {
	return (
		<ul className="flex flex-wrap gap-1.5">
			{present.map((p) => (
				<li key={p.memberId}>
					<Badge
						variant={p.optOut ? "outline" : "secondary"}
						className="font-normal"
					>
						{p.displayName}
						{p.displayName === moderatorName ? " · Mod" : ""}
					</Badge>
				</li>
			))}
			{present.length === 0 && (
				<li className="text-sm text-muted-foreground">Nadie aún.</li>
			)}
		</ul>
	);
}

// ── Variante A — Ritual: una sola acción a la vez ───────────────────────────
// Jerarquía: un único foco (la acción del momento), todo lo demás baja a
// muted. La UI avanza contigo; ninguna otra acción compite.

function VariantA({
	sim,
	isModerator,
	myName,
	moderatorName,
	imPresent,
	toggleOptOut,
	runDraw,
	startDebate,
}: ReturnType<typeof useLobbySim> & {
	isModerator: boolean;
	myName: string;
	moderatorName: string | null;
}) {
	const eligible = sim.present.filter((p) => !p.optOut).length;

	let focus: {
		hint: string;
		action?: { label: string; onClick: () => void };
		waiting?: string;
	};
	if (!sim.mePresent) {
		focus = {
			hint: "¿Llegaste?",
			action: { label: "Estoy presente", onClick: imPresent },
		};
	} else if (sim.phase === "arriving" && !sim.drawDone && isModerator) {
		focus = {
			hint: `${eligible} en sorteo. Cuando estén todos:`,
			action: { label: "Ejecutar sorteo", onClick: runDraw },
		};
	} else if (sim.phase === "arriving" && !sim.drawDone) {
		focus = {
			hint: "Esperando al moderador…",
			waiting: `${moderatorName} ejecuta el sorteo cuando todos estén.`,
		};
	} else if (sim.phase === "arriving" && sim.drawDone && isModerator) {
		focus = {
			hint: "El sorteo quedó oculto. Nadie sabe su pregunta.",
			action: { label: "Comenzar debate", onClick: startDebate },
		};
	} else if (sim.phase === "arriving" && sim.drawDone) {
		focus = {
			hint: "Sorteo listo · oculto.",
			waiting: `${moderatorName} comienza el debate.`,
		};
	} else {
		focus = {
			hint: "El debate está en curso.",
			waiting: "La primera pregunta se revela en el escenario.",
		};
	}

	return (
		<div className="flex flex-col gap-8">
			<Card className="border-primary/25 ring-1 ring-primary/15">
				<CardContent className="flex flex-col items-center gap-5 py-10 text-center">
					<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						{PHASE_LABEL[sim.phase]}
					</p>
					<p className="max-w-xs text-balance text-xl font-semibold leading-snug">
						{focus.hint}
					</p>
					{focus.action ? (
						<Button
							size="lg"
							className="h-12 px-8 text-base"
							onClick={focus.action.onClick}
						>
							{focus.action.label}
						</Button>
					) : (
						focus.waiting && (
							<p className="text-sm text-muted-foreground">{focus.waiting}</p>
						)
					)}
					{sim.mePresent && sim.phase === "arriving" && (
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground"
							onClick={toggleOptOut}
						>
							{sim.meOptOut
								? "Entrar al sorteo"
								: "Solo conversar (sin sorteo)"}
						</Button>
					)}
				</CardContent>
			</Card>

			<div className="flex flex-col gap-2 opacity-70 transition-opacity">
				<p className="text-xs font-medium text-muted-foreground">
					Presentes ({sim.present.length})
				</p>
				<PresenceDots present={sim.present} moderatorName={moderatorName} />
			</div>
		</div>
	);
}

// ── Variante B — Antesala: el escenario visible desde el lobby ──────────────
// El debate ya tiene lugar físico en pantalla (preview atenuado); el lobby es
// una fila de checklist. CTA flotante contextual según rol.

function VariantB({
	sim,
	isModerator,
	moderatorName,
	imPresent,
	toggleOptOut,
	runDraw,
	startDebate,
}: ReturnType<typeof useLobbySim> & {
	isModerator: boolean;
	moderatorName: string | null;
}) {
	const eligible = sim.present.filter((p) => !p.optOut).length;

	const stepDone = (i: number) =>
		i === 0
			? sim.present.length > 0
			: i === 1
				? sim.drawDone
				: sim.phase === "live";

	let cta: { label: string; onClick: () => void } | null = null;
	if (!sim.mePresent) cta = { label: "Estoy presente", onClick: imPresent };
	else if (sim.phase === "arriving" && !sim.drawDone && isModerator)
		cta = { label: "Ejecutar sorteo", onClick: runDraw };
	else if (sim.phase === "arriving" && sim.drawDone && isModerator)
		cta = { label: "Comenzar debate", onClick: startDebate };

	return (
		<div className="flex flex-col gap-6 pb-20">
			{/* Preview del escenario */}
			<div
				className={`relative overflow-hidden rounded-xl border bg-gradient-to-br from-secondary/50 via-card to-accent/30 p-6 transition-all duration-300 ${sim.phase === "live" ? "ring-2 ring-primary/40" : ""}`}
			>
				{sim.phase !== "live" && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/55 backdrop-blur-[3px]">
						<Badge variant="outline" className="bg-card/90 shadow-sm">
							El debate empieza acá
						</Badge>
					</div>
				)}
				<div className={sim.phase === "live" ? "" : "opacity-45 select-none"}>
					<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Escenario
					</p>
					<p className="mt-3 font-heading text-lg font-semibold">
						{sim.phase === "live"
							? "«¿Qué te hizo pensar el capítulo 2?»"
							: "Pregunta aún oculta"}
					</p>
					<div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
						<span className="inline-block h-9 w-9 rounded-full border border-border bg-secondary/60" />
						<span>
							{sim.phase === "live"
								? "Ana · Momento de preparación"
								: "Asignado oculto"}
						</span>
						<span className="ml-auto tabular-nums">
							{sim.phase === "live" ? "01:30" : "--:--"}
						</span>
					</div>
				</div>
			</div>

			{/* Checklist de avance */}
			<ol className="flex items-center gap-2 text-sm">
				{[
					`Presentes · ${eligible + sim.present.filter((p) => p.optOut).length}`,
					sim.drawDone ? "Sorteo oculto" : "Sin sortear",
					sim.phase === "live" ? "En debate" : "Debate",
				].map((label, i) => (
					<li key={label} className="flex flex-1 items-center gap-2">
						<span
							className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
								stepDone(i)
									? "border-primary bg-primary text-primary-foreground"
									: "border-border text-muted-foreground"
							}`}
						>
							{stepDone(i) ? (
								<HugeiconsIcon icon={CheckmarkCircleIcon} className="size-3" />
							) : (
								i + 1
							)}
						</span>
						<span
							className={stepDone(i) ? "font-medium" : "text-muted-foreground"}
						>
							{label}
						</span>
						{i < 2 && <span className="h-px flex-1 bg-border" />}
					</li>
				))}
			</ol>

			{/* Presencia compacta */}
			<div className="flex flex-col gap-2">
				<p className="text-xs font-medium text-muted-foreground">En la mesa</p>
				<PresenceDots present={sim.present} moderatorName={moderatorName} />
				{sim.mePresent && sim.phase === "arriving" && (
					<Button
						variant="link"
						size="sm"
						className="h-auto self-start p-0 text-muted-foreground"
						onClick={toggleOptOut}
					>
						{sim.meOptOut ? "Entrar al sorteo" : "Solo conversar"}
					</Button>
				)}
			</div>

			{/* CTA flotante contextual */}
			{cta && (
				<div className="fixed right-6 bottom-24 z-40">
					<Button size="lg" className="h-12 shadow-lg" onClick={cta.onClick}>
						{cta.label}
						<HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
					</Button>
				</div>
			)}
			{!cta && sim.phase === "arriving" && (
				<p className="fixed right-6 bottom-24 z-40 rounded-full border bg-card/95 px-4 py-2 text-sm shadow-lg backdrop-blur">
					{sim.drawDone
						? `Esperando a ${moderatorName}…`
						: `${moderatorName} ejecuta el sorteo`}
				</p>
			)}
		</div>
	);
}

// ── Variante C — Cronología: la sala narra lo que pasa ──────────────────────
// Un banner dice de quién es el turno; abajo, el feed de eventos cuenta la
// historia de la sesión. Menos botones, más contexto.

function VariantC({
	sim,
	isModerator,
	myName,
	moderatorName,
	imPresent,
	toggleOptOut,
	runDraw,
	startDebate,
}: ReturnType<typeof useLobbySim> & {
	isModerator: boolean;
	myName: string;
	moderatorName: string | null;
}) {
	const now: {
		who: string;
		what: string;
		mine: boolean;
		act?: () => void;
		label?: string;
	} = !sim.mePresent
		? {
				who: "vos",
				what: "confirmar presencia",
				mine: true,
				act: imPresent,
				label: "Estoy presente",
			}
		: sim.phase === "arriving" && !sim.drawDone && isModerator
			? {
					who: "vos",
					what: "ejecutar el sorteo",
					mine: true,
					act: runDraw,
					label: "Ejecutar sorteo",
				}
			: sim.phase === "arriving" && !sim.drawDone
				? {
						who: moderatorName ?? "el moderador",
						what: "ejecutar el sorteo",
						mine: false,
					}
				: sim.phase === "arriving" && sim.drawDone && isModerator
					? {
							who: "vos",
							what: "comenzar el debate",
							mine: true,
							act: startDebate,
							label: "Comenzar debate",
						}
					: sim.phase === "arriving"
						? {
								who: moderatorName ?? "el moderador",
								what: "comenzar el debate",
								mine: false,
							}
						: { who: "todos", what: "están debatiendo 🎉", mine: false };

	return (
		<div className="flex flex-col gap-6">
			<Card
				className={now.mine ? "border-primary/40 ring-1 ring-primary/25" : ""}
			>
				<CardHeader>
					<CardDescription>Ahora</CardDescription>
					<CardTitle className="text-base font-normal leading-snug">
						Turno de <span className="font-semibold">{now.who}</span>:{" "}
						{now.what}
					</CardTitle>
					{now.mine && now.act && now.label && (
						<Button onClick={now.act} className="mt-1 w-fit">
							{now.label}
						</Button>
					)}
				</CardHeader>
			</Card>

			<div className="flex flex-col gap-2">
				<p className="text-xs font-medium text-muted-foreground">
					En la mesa ({sim.present.length})
				</p>
				<PresenceDots present={sim.present} moderatorName={moderatorName} />
				{sim.mePresent && sim.phase === "arriving" && (
					<Button
						variant="link"
						size="sm"
						className="h-auto w-fit p-0 text-muted-foreground"
						onClick={toggleOptOut}
					>
						{sim.meOptOut ? "Entrar al sorteo" : "Solo conversar"}
					</Button>
				)}
			</div>

			<ol className="relative flex flex-col gap-3 border-l pl-4 text-sm">
				{[...sim.feed].reverse().map((entry, i) => (
					<li key={`${entry}-${i}`} className="relative">
						<span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-border first:bg-primary" />
						<span
							className={i === 0 ? "text-foreground" : "text-muted-foreground"}
						>
							{entry}
						</span>
					</li>
				))}
				{!sim.feed.includes(`Confirmaste presencia`) && myName && null}
			</ol>
		</div>
	);
}

// ── Switcher flotante ───────────────────────────────────────────────────────

const VARIANTS = [
	{ key: "A", name: "Ritual · una acción a la vez" },
	{ key: "B", name: "Antesala · escenario visible" },
	{ key: "C", name: "Cronología · la sala narra" },
] as const;

function ProtoSwitcher({ current }: { current: string }) {
	const router = useRouter();
	const pathname = usePathname();

	const go = useCallback(
		(dir: 1 | -1) => {
			const idx = VARIANTS.findIndex((v) => v.key === current);
			const next = VARIANTS[(idx + dir + VARIANTS.length) % VARIANTS.length];
			router.replace(`${pathname}?variant=${next.key}`);
		},
		[current, pathname, router],
	);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			const el = document.activeElement;
			if (
				el &&
				(el.tagName === "INPUT" ||
					el.tagName === "TEXTAREA" ||
					(el as HTMLElement).isContentEditable)
			)
				return;
			if (e.key === "ArrowRight") go(1);
			if (e.key === "ArrowLeft") go(-1);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [go]);

	const meta = VARIANTS.find((v) => v.key === current);

	return (
		<div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-destructive/30 bg-destructive/95 px-2 py-1.5 shadow-xl">
			<Button
				variant="ghost"
				size="icon-sm"
				aria-label="Variante anterior"
				className="text-destructive-foreground hover:bg-destructive-foreground/20"
				onClick={() => go(-1)}
			>
				<HugeiconsIcon icon={ArrowLeft02Icon} />
			</Button>
			<span className="min-w-56 text-center text-xs font-medium text-destructive-foreground tabular-nums">
				PROTO · {meta?.key} — {meta?.name}
			</span>
			<Button
				variant="ghost"
				size="icon-sm"
				aria-label="Variante siguiente"
				className="text-destructive-foreground hover:bg-destructive-foreground/20"
				onClick={() => go(1)}
			>
				<HugeiconsIcon icon={ArrowRight01Icon} />
			</Button>
		</div>
	);
}

// ── Controles de simulación ─────────────────────────────────────────────────

function SimControls({
	role,
	setRole,
	someoneArrives,
	reset,
	phase,
}: Pick<
	ReturnType<typeof useLobbySim>,
	"role" | "setRole" | "someoneArrives" | "reset" | "sim"
> & { phase: Phase }) {
	return (
		<div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-destructive/40 px-3 py-2 text-xs text-muted-foreground">
			<span className="font-semibold tracking-wide text-destructive uppercase">
				Proto
			</span>
			<div className="flex overflow-hidden rounded-md border">
				<button
					type="button"
					onClick={() => setRole("moderator")}
					className={`px-2 py-1 ${role === "moderator" ? "bg-secondary font-medium" : "hover:bg-muted"}`}
				>
					Vista Moderador
				</button>
				<button
					type="button"
					onClick={() => setRole("member")}
					className={`px-2 py-1 ${role === "member" ? "bg-secondary font-medium" : "hover:bg-muted"}`}
				>
					Vista Participante
				</button>
			</div>
			<Button
				variant="outline"
				size="sm"
				className="h-7 text-xs"
				onClick={someoneArrives}
			>
				+ Alguien llega
			</Button>
			<Button
				variant="outline"
				size="sm"
				className="h-7 text-xs"
				onClick={reset}
			>
				Reiniciar
			</Button>
			<span className="ml-auto tabular-nums">fase: {PHASE_LABEL[phase]}</span>
		</div>
	);
}

// ── Raíz del prototipo ──────────────────────────────────────────────────────

export function LobbyProto({
	lobby,
	variant,
	myId,
	myName,
	realIsModerator,
}: {
	lobby: LobbySnapshot;
	variant: string;
	myId: string;
	myName: string;
	realIsModerator: boolean;
}) {
	const sim = useLobbySim(lobby, myName, realIsModerator);
	const moderatorName =
		lobby.participants.find((p) => p.memberId === lobby.moderatorId)
			?.displayName ?? "El moderador";

	const common = {
		...sim,
		isModerator: sim.role === "moderator",
		myName,
		moderatorName,
	};

	return (
		<>
			<SimControls
				role={sim.role}
				setRole={sim.setRole}
				someoneArrives={sim.someoneArrives}
				reset={sim.reset}
				sim={sim.sim}
				phase={sim.sim.phase}
			/>
			{variant === "B" ? (
				<VariantB {...common} />
			) : variant === "C" ? (
				<VariantC {...common} />
			) : (
				<VariantA {...common} />
			)}
			<ProtoSwitcher current={variant} />
		</>
	);
}
