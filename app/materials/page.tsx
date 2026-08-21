import { Book01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { MaterialsGrid } from "./_components/materials-grid";
import { getMaterials } from "./_lib/materials";

export const metadata = {
	title: "Materiales · Café y Tertulia",
	description: "Pipeline de materiales del club.",
};

export default async function MaterialsPage() {
	const supabase = await createClient();
	const materials = await getMaterials(supabase);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 pb-20">
			<header className="flex items-center justify-between gap-4">
				<div>
					<h1 className="font-heading text-2xl font-medium">Materiales</h1>
					<p className="text-sm text-muted-foreground">
						Portadas — el club como estantería.
					</p>
				</div>
				<Button nativeButton={false} render={<Link href="/materials/new" />}>
					<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
					Proponer material
				</Button>
			</header>

			{materials.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-8 text-center">
						<HugeiconsIcon
							icon={Book01Icon}
							className="text-muted-foreground"
						/>
						<p className="text-sm text-muted-foreground">
							Todavía no hay materiales. Propón el primero y el club lo
							conversa.
						</p>
					</CardContent>
				</Card>
			) : (
				<MaterialsGrid materials={materials} />
			)}
		</div>
	);
}
