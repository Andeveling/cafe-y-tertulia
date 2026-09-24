import { Book01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MaterialsGrid } from "@/app/materials/_components/materials-grid";
import { getMaterials } from "@/app/materials/_lib/materials";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { inactiveMemberDestination } from "@/lib/auth/redirect";
import { getCurrentMember } from "@/lib/current-member";
import { getGroupBySlug } from "@/lib/groups/queries";

export const metadata = { title: "Materiales · Café y Tertulias" };

export default async function GroupMaterialsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const { member, supabase } = await getCurrentMember();
	if (!member) redirect("/auth/login");
	const inactiveDestination = inactiveMemberDestination(member.status);
	if (inactiveDestination) redirect(inactiveDestination);

	const group = await getGroupBySlug(supabase, slug, member.id);
	if (!group || group.role == null) notFound();

	const materials = await getMaterials(group.id);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between gap-4">
				<p className="text-sm text-muted-foreground">
					La estantería de {group.name}.
				</p>
				<Button
					nativeButton={false}
					render={<Link href={`/g/${slug}/materiales/nuevo`} />}
				>
					<HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
					Proponer material
				</Button>
			</div>

			{materials.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-3 py-8 text-center">
						<HugeiconsIcon
							icon={Book01Icon}
							className="text-muted-foreground"
						/>
						<p className="text-sm text-muted-foreground">
							Todavía no hay materiales en {group.name}.
						</p>
					</CardContent>
				</Card>
			) : (
				<MaterialsGrid materials={materials} />
			)}
		</div>
	);
}
