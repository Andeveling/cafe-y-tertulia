"use client";

/**
 * PROTOTYPE — throwaway.
 *
 * Tres variantes estructuralmente distintas del TurnSpotlight consolidado a
 * UNA sola card ("aria-label=En la palabra"). La sección "aria-label=Reloj
 * del turno" desaparece; el cronómetro entra en la card única y los corazones
 * se anclan debajo del blockquote.
 *
 *   A — "Reloj al tope"        : el reloj abre la card como ancla visual,
 *                                 el microtítulo baja, luego avatar/pregunta/
 *                                 blockquote, corazones al pie.
 *
 *   B — "Header + footer"      : reloj + label comparten header row con
 *                                 divisor. Contenido centrado al medio.
 *                                 Corazones en footer row con divisor.
 *
 *   C — "Label + reloj pequeño": label a la izquierda, reloj miniaturizado a
 *                                 la derecha del header. Contenido y corazones
 *                                 sin divisores intermedios (más ligero).
 */

import { HeartPicker } from "@/app/materials/_components/heart-picker";
import {
	MOCK_HEART_VALUE,
	MOCK_TURN_PROPS,
} from "@/app/prototype/turn-spotlight/mock-data";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VariantProps = {
	speakerName: string;
	speakerAvatar: string | null;
	speakerVerb: string;
	isComplement: boolean;
	authorName: string;
	questionText: string;
	clockText: string;
	overtime: boolean;
	timerPct: number;
	voter: boolean;
};

const CARD_CLASS =
	"w-full rounded-xl bg-card px-6 py-8 text-center ring-1 ring-foreground/10";

const TIMER_ACTION = (
	<Button variant="outline" size="sm" type="button">
		+1 min
	</Button>
);

function ClockBlock({ size }: { size: "5xl" | "4xl" | "3xl" }) {
	return (
		<p
			className={cn(
				"font-heading tabular-nums tracking-tight text-foreground",
				size === "5xl" && "text-5xl",
				size === "4xl" && "text-4xl",
				size === "3xl" && "text-3xl",
			)}
		>
			{MOCK_TURN_PROPS.clockText}
		</p>
	);
}

function ProgressBar({ pct }: { pct: number }) {
	return (
		<div
			aria-hidden="true"
			className="mx-auto mt-3 h-1 max-w-md overflow-hidden rounded-full bg-muted"
		>
			<div
				className="h-full rounded-full bg-reward"
				style={{ width: `${pct}%` }}
			/>
		</div>
	);
}

function SpeakerIdentity({
	isComplement,
	speakerName,
	speakerVerb,
}: Pick<VariantProps, "isComplement" | "speakerName" | "speakerVerb">) {
	return (
		<>
			<span aria-hidden="true" className="mx-auto mt-4 block w-fit">
				<MemberAvatar
					name={speakerName}
					avatar={null}
					className={cn(
						"size-[4.5rem] font-heading ring-1 ring-primary/40",
						"[&_[data-slot=avatar-fallback]]:bg-primary/10",
						"[&_[data-slot=avatar-fallback]]:text-2xl",
						"[&_[data-slot=avatar-fallback]]:text-primary",
					)}
				/>
			</span>
			<p className="font-heading mt-3 text-3xl font-semibold text-balance">
				{speakerName}
			</p>
			<p className="mt-2">
				<span
					className={cn(
						"inline-block rounded-full px-4 py-1 text-xs font-bold tracking-[0.08em] ring-1",
						isComplement
							? "bg-reward/15 text-reward ring-reward/30"
							: "bg-primary/15 text-primary ring-primary/30",
					)}
				>
					{speakerVerb}
				</span>
			</p>
		</>
	);
}

function Blockquote({
	question,
	author,
}: {
	question: string;
	author: string;
}) {
	return (
		<blockquote className="mx-auto mt-6 max-w-xl text-center">
			<span
				aria-hidden="true"
				className="font-heading block text-4xl leading-none text-primary"
			>
				“
			</span>
			<p className="font-heading mt-2 text-2xl font-medium text-balance italic leading-snug">
				{question}
			</p>
			<footer className="mt-4 flex items-center gap-3">
				<span aria-hidden="true" className="h-px flex-1 bg-foreground/15" />
				<span className="text-label-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">
					Pregunta de <cite className="not-italic">{author}</cite>
				</span>
				<span aria-hidden="true" className="h-px flex-1 bg-foreground/15" />
			</footer>
		</blockquote>
	);
}

const MOCK_VOTE = () => {
	// HeartPicker interactivo (visualmente fiel al picker de producción).
	// En el prototipo onVote es noop: solo necesitamos ver cómo respira.
	return (
		<HeartPicker value={MOCK_HEART_VALUE} disabled={false} onVote={() => {}} />
	);
};

/* ──────────────────────────────────────────────────────────────────────── */
/*  VARIANT A — Reloj al tope                                              */
/* ──────────────────────────────────────────────────────────────────────── */

export function VariantA(props: VariantProps) {
	return (
		<section aria-label="En la palabra" className={CARD_CLASS}>
			<div className="flex items-center justify-center gap-3">
				<ClockBlock size="5xl" />
				{TIMER_ACTION}
			</div>
			<ProgressBar pct={props.timerPct} />

			<p className="mt-8 text-label-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">
				En la palabra
			</p>

			<SpeakerIdentity
				isComplement={props.isComplement}
				speakerName={props.speakerName}
				speakerVerb={props.speakerVerb}
			/>

			<Blockquote question={props.questionText} author={props.authorName} />

			{props.voter && (
				<div className="mt-8 flex justify-center">{MOCK_VOTE()}</div>
			)}
		</section>
	);
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  VARIANT B — Header row + footer row (con divisores)                   */
/* ──────────────────────────────────────────────────────────────────────── */

export function VariantB(props: VariantProps) {
	return (
		<section aria-label="En la palabra" className={CARD_CLASS}>
			<div className="flex items-baseline justify-between gap-4 border-b border-foreground/10 pb-4">
				<div className="flex items-center gap-3">
					<ClockBlock size="4xl" />
					{TIMER_ACTION}
				</div>
				<p className="text-label-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">
					En la palabra
				</p>
			</div>
			<ProgressBar pct={props.timerPct} />

			<SpeakerIdentity
				isComplement={props.isComplement}
				speakerName={props.speakerName}
				speakerVerb={props.speakerVerb}
			/>

			<Blockquote question={props.questionText} author={props.authorName} />

			{props.voter && (
				<div className="mt-6 flex justify-center border-t border-foreground/10 pt-4">
					{MOCK_VOTE()}
				</div>
			)}
		</section>
	);
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  VARIANT C — Label izquierda, reloj pequeño a la derecha               */
/* ──────────────────────────────────────────────────────────────────────── */

export function VariantC(props: VariantProps) {
	return (
		<section aria-label="En la palabra" className={CARD_CLASS}>
			<div className="flex items-baseline justify-between gap-4">
				<p className="text-label-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">
					En la palabra
				</p>
				<div className="flex items-center gap-3">
					<ClockBlock size="3xl" />
					{TIMER_ACTION}
				</div>
			</div>
			<ProgressBar pct={props.timerPct} />

			<div className="mt-6">
				<SpeakerIdentity
					isComplement={props.isComplement}
					speakerName={props.speakerName}
					speakerVerb={props.speakerVerb}
				/>

				<Blockquote question={props.questionText} author={props.authorName} />
			</div>

			{props.voter && (
				<div className="mt-8 flex justify-center">{MOCK_VOTE()}</div>
			)}
		</section>
	);
}
