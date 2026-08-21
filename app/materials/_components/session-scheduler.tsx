"use client";

import { Calendar01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { rescheduleSession } from "@/app/materials/_lib/materials-actions";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

export function SessionScheduler({
	materialId,
	sessionId,
	scheduledAt,
}: {
	materialId: string;
	sessionId: string;
	scheduledAt: string | null;
}) {
	const [date, setDate] = useState<Date | undefined>(
		scheduledAt ? new Date(scheduledAt) : undefined,
	);
	const [isPending, startTransition] = useTransition();

	function update(next: Date | undefined) {
		setDate(next);
		startTransition(async () => {
			const result = await rescheduleSession({
				materialId,
				sessionId,
				scheduledAt: next ? next.toISOString() : null,
			});
			if ("error" in result) {
				toast.error(result.error);
				setDate(scheduledAt ? new Date(scheduledAt) : undefined);
			} else {
				toast.success(next ? "Sesión reprogramada" : "Fecha eliminada");
			}
		});
	}

	return (
		<div className="flex items-center gap-1.5">
			<DatePicker
				date={date}
				onSelect={update}
				placeholder="Sin fecha programada"
				className="h-auto rounded-md border-0 px-1 py-1 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground data-[empty=true]:text-muted-foreground"
			/>
			{date && (
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					disabled={isPending}
					aria-label="Quitar fecha programada"
					onClick={() => update(undefined)}
				>
					<HugeiconsIcon icon={Cancel01Icon} />
				</Button>
			)}
		</div>
	);
}
