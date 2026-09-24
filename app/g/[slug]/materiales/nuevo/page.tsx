import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MaterialForm } from "@/app/materials/_components/material-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { inactiveMemberDestination } from "@/lib/auth/redirect";
import { getCurrentMember } from "@/lib/current-member";
import { getGroupBySlug } from "@/lib/groups/queries";

export const metadata = { title: "Proponer material · Café y Tertulia" };

export default async function NewGroupMaterialPage({
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

	return (
		<div className="flex w-full max-w-xl flex-col gap-6">
			<Button
				variant="ghost"
				size="sm"
				nativeButton={false}
				render={<Link href={`/g/${slug}/materiales`} />}
				className="w-fit"
			>
				<HugeiconsIcon icon={ArrowLeftIcon} data-icon="inline-start" />
				Volver a materiales
			</Button>

			<Card>
				<CardHeader>
					<p className="text-sm text-muted-foreground">
						Entra como propuesto en {group.name}.
					</p>
				</CardHeader>
				<CardContent>
					<MaterialForm groupId={group.id} slug={slug} />
				</CardContent>
			</Card>
		</div>
	);
}
