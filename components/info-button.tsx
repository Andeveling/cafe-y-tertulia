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
						className="text-[oklch(0.55_0.08_250)] hover:text-[oklch(0.45_0.1_250)]"
					/>
				}
			>
				<HugeiconsIcon icon={InformationCircleIcon} size={14} />
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
