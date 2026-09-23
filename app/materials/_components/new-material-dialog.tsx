"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { MaterialForm } from "./material-form";

export function NewMaterialDialog({
	groupId,
	slug,
}: {
	groupId: string;
	slug: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	const handleSuccess = () => {
		setOpen(false);
		router.refresh(); // Refresh server components (the materials list)
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button>
						<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
						Proponer material
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-[520px]">
				<DialogHeader>
					<DialogTitle className="font-heading text-2xl">
						Proponer material
					</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground -mt-2">
					Todo material entra como propuesto y el club decide cómo avanza.
				</p>
				<MaterialForm groupId={groupId} slug={slug} onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	);
}
