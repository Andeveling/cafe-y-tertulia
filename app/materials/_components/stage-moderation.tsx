"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";

export function ModeratorZone({ children }: { children: ReactNode }) {
	return (
		<div className="flex w-full flex-col items-start gap-2 border-t border-border/60 pt-4">
			<p className="text-xs font-medium">Moderación</p>
			<p className="text-xs text-muted-foreground">Solo tú ves esto.</p>
			{children}
		</div>
	);
}

/** Primer clic arma; segundo confirma; X cancela — evita miss-clicks. */
export function ConfirmActionButton({
	label,
	pending,
	onConfirm,
}: {
	label: string;
	pending: boolean;
	onConfirm: () => void;
}) {
	const [armed, setArmed] = useState(false);
	const [lastLabel, setLastLabel] = useState(label);
	if (lastLabel !== label) {
		setLastLabel(label);
		setArmed(false);
	}
	const reduce = useReducedMotion();

	return (
		<div
			className="flex min-h-(--control-height) items-center"
			role="group"
			aria-label={label}
		>
			<AnimatePresence mode="wait" initial={false}>
				{!armed ? (
					<motion.div
						key="idle"
						initial={
							reduce
								? { opacity: 0 }
								: { opacity: 0, x: -12, scale: 0.98, filter: "blur(4px)" }
						}
						animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
						exit={
							reduce
								? { opacity: 0 }
								: { opacity: 0, x: 12, scale: 0.98, filter: "blur(4px)" }
						}
						transition={
							reduce
								? { duration: 0.12, ease: "easeOut" }
								: { duration: 0.14, ease: [0.16, 1, 0.3, 1] }
						}
					>
						<Button disabled={pending} onClick={() => setArmed(true)}>
							{label}
						</Button>
					</motion.div>
				) : (
					<motion.div
						key="armed"
						className="flex items-center gap-1.5"
						initial={
							reduce
								? { opacity: 0 }
								: { opacity: 0, x: 12, scale: 0.98, filter: "blur(4px)" }
						}
						animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
						exit={
							reduce
								? { opacity: 0 }
								: { opacity: 0, x: -12, scale: 0.98, filter: "blur(4px)" }
						}
						transition={
							reduce
								? { duration: 0.12, ease: "easeOut" }
								: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
						}
					>
						<Button disabled={pending} onClick={onConfirm} autoFocus>
							Confirmar
						</Button>
						<Button
							variant="ghost"
							size="icon"
							disabled={pending}
							aria-label="Cancelar"
							onClick={() => setArmed(false)}
						>
							<HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
						</Button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
