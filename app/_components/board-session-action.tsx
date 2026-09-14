"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { advanceSession } from "@/app/materials/_lib/materials-actions";
import { Button } from "@/components/ui/button";
import {
	type BoardSession,
	sessionCta,
	sessionHref,
	sessionOpensSala,
} from "./board-helpers";

type Props = {
	session: BoardSession;
	variant: "hero" | "row";
};

/**
 * Un clic: preparation abre la Sala y entra; lobby/en curso solo entra.
 * No hay segunda "Abrir sala" en el camino desde Inicio.
 */
export function BoardSessionAction({ session, variant }: Props) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const label = sessionCta(session.status, variant);
	const size = variant === "hero" ? "lg" : "sm";
	const buttonVariant = variant === "hero" ? "default" : "ghost";

	if (!sessionOpensSala(session.status)) {
		return (
			<Button
				size={size}
				variant={buttonVariant}
				className={
					variant === "hero" ? "w-full shrink-0 sm:w-auto" : "shrink-0"
				}
				nativeButton={false}
				render={<Link href={sessionHref(session)} />}
			>
				{label}
			</Button>
		);
	}

	return (
		<Button
			size={size}
			variant={buttonVariant}
			className={variant === "hero" ? "w-full shrink-0 sm:w-auto" : "shrink-0"}
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
		</Button>
	);
}
