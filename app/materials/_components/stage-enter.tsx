"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function Enter({ children }: { children: ReactNode }) {
	const reduce = useReducedMotion();
	return (
		<motion.div
			initial={reduce ? false : { opacity: 0, y: 16, filter: "blur(10px)" }}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			exit={reduce ? undefined : { opacity: 0, filter: "blur(8px)" }}
			transition={{
				type: "spring",
				visualDuration: 0.5,
				bounce: 0.08,
				opacity: { duration: 0.4, ease: "easeOut" },
				filter: { duration: 0.45, ease: "easeOut" },
			}}
		>
			{children}
		</motion.div>
	);
}
