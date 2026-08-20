import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { MaterialForm } from "@/components/materials/material-form";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const metadata = {
	title: "Proponer material · Café y Tertulia",
};

export default function NewMaterialPage() {
	return (
		<div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-6">
			<Button
				variant="ghost"
				size="sm"
				render={<Link href="/materiales" />}
				className="w-fit"
			>
				<HugeiconsIcon icon={ArrowLeftIcon} data-icon="inline-start" />
				Volver a materiales
			</Button>

			<Card>
				<CardHeader>
					<CardTitle>Proponer material</CardTitle>
					<CardDescription>
						Todo material entra como propuesto y el club decide cómo avanza.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<MaterialForm />
				</CardContent>
			</Card>
		</div>
	);
}
