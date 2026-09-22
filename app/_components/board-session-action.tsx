"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { advanceSession } from "@/app/materials/_lib/materials-actions";
import { clearLeftRoom } from "@/app/materials/_lib/room-seat-gate";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	type BoardSession,
	sessionCta,
	sessionHasBoardCta,
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
	if (!sessionHasBoardCta(session)) return null;
	const label = sessionCta(session.status, variant);
	const size = variant === "hero" ? "lg" : "sm";
	const buttonVariant = variant === "hero" ? "default" : "ghost";
	const className = cn(
		"shrink-0",
		variant === "hero" && "w-full sm:w-auto",
		variant === "row" && "min-h-11",
		fullWidth && "w-full sm:w-full",
	);

	if (!sessionOpensSala(session.status)) {
		return (
			<Button
				size={size}
				variant={buttonVariant}
				className={className}
				nativeButton={false}
				render={
					<Link href={sessionHref(session)} onClick={() => clearLeftRoom()} />
				}
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
					clearLeftRoom();
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
