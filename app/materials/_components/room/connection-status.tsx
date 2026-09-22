"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function RoomConnectionStatus({ live }: { live: boolean }) {
	const router = useRouter();

	function handleRetryConnection() {
		startTransition(() => router.refresh());
	}

	if (live) {
		return (
			<p role="status" className="inline-flex">
				<Badge variant="secondary" className="gap-1.5">
					<span aria-hidden="true" className="size-2 rounded-full bg-primary" />
					En vivo
				</Badge>
			</p>
		);
	}

	return (
		<p
			role="status"
			aria-live="assertive"
			className="inline-flex flex-wrap items-center gap-2"
		>
			<Badge variant="outline" className="gap-1.5">
				<span
					aria-hidden="true"
					className="size-2 rounded-full bg-primary motion-safe:animate-pulse"
				/>
				Reconectando…
			</Badge>
			<Button variant="ghost" size="xs" onClick={handleRetryConnection}>
				Reintentar
			</Button>
		</p>
	);
}
