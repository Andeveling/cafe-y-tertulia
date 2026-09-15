"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { advanceSession } from "@/app/materials/_lib/materials-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	type BoardSession,
	sessionCta,
	sessionHref,
	sessionOpensSala,
} from "./board-helpers";

type Props = {
	session: BoardSession;
	variant: "hero" | "row";
	fullWidth?: boolean;
	children?: ReactNode;
};

/**
 * Un clic: preparation abre la Sala y entra; lobby/en curso solo entra.
 * No hay segunda "Abrir sala" en el camino desde Inicio.
 */
export function BoardSessionAction({
	session,
	variant,
	fullWidth,
	children,
}: Props) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const label = sessionCta(session.status, variant);
	const size = variant === "hero" ? "lg" : "sm";
	const buttonVariant = variant === "hero" ? "default" : "ghost";
	const className = cn(
		"shrink-0",
		variant === "hero" && "w-full sm:w-auto",
		fullWidth && "w-full sm:w-full",
	);

	if (!sessionOpensSala(session.status)) {
		return (
			<Button
				size={size}
				variant={buttonVariant}
				className={className}
				nativeButton={false}
				render={<Link href={sessionHref(session)} />}
			>
				{label}
				{children}
			</Button>
		);
	}

	return (
		<Button
			size={size}
			variant={buttonVariant}
			className={className}
			disabled={pending}
			onClick={() =>
				start(async () => {
					const result = await advanceSession({
						sessionId: session.id,
						materialId: session.material_id,
					});
					if ("error" in result) {
						toast.error(result.error);
						return;
					}
					router.push(sessionHref(session));
				})
			}
		>
			{label}
			{children}
		</Button>
	);
}
