"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { SessionForm } from "@/app/materials/_components/session-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

export function NewSessionDialog({ materialId }: { materialId: string }) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button size="lg">
						<HugeiconsIcon icon={PlusSignIcon} className="mr-2 size-4" />
						Nueva sesión
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-[560px]">
				<DialogHeader>
					<DialogTitle className="font-heading text-2xl">
						Nueva sesión
					</DialogTitle>
				</DialogHeader>

				<div className="pt-2">
					<SessionForm
						materialId={materialId}
						onSuccess={() => setOpen(false)}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
