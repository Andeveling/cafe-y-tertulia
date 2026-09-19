"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Reusable info button with popover. Shows an (i) icon that opens
 * a popover with a title and description explaining a concept.
 *
 * @example
 * <InfoButton title="Insignias" description="Logros individuales..." />
 */
export function InfoButton({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						variant="ghost"
						size="icon-xs"
						aria-label={`Información: ${title}`}
						className="size-11 min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
					/>
				}
			>
				<HugeiconsIcon
					icon={InformationCircleIcon}
					size={16}
					aria-hidden="true"
				/>
			</PopoverTrigger>
			<PopoverContent side="top" align="start">
				<PopoverHeader>
					<PopoverTitle>{title}</PopoverTitle>
					<PopoverDescription>{description}</PopoverDescription>
				</PopoverHeader>
			</PopoverContent>
		</Popover>
	);
}
