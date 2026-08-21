"use client";

import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DatePicker({
	date,
	onSelect,
	placeholder = "Selecciona una fecha",
	className,
	id,
}: {
	date: Date | undefined;
	onSelect: (date: Date | undefined) => void;
	placeholder?: string;
	className?: string;
	id?: string;
}) {
	return (
		<Popover>
			<PopoverTrigger
				id={id}
				render={
					<Button
						type="button"
						variant="outline"
						data-empty={!date}
						className={cn(
							"justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
							className,
						)}
					/>
				}
			>
				<HugeiconsIcon icon={Calendar01Icon} />
				{date ? format(date, "PPP", { locale: es }) : placeholder}
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={date}
					onSelect={onSelect}
					locale={es}
				/>
			</PopoverContent>
		</Popover>
	);
}
