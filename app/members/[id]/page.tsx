import { UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { notFound } from "next/navigation";
import { getMemberProfile } from "@/app/materials/_lib/materials";
import { getBadgeIcon } from "@/components/badge-icons";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Miembro · Café y Tertulia" };

export default async function MemberProfilePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const supabase = await createClient();
	const profile = await getMemberProfile(supabase, (await params).id);
	if (!profile) notFound();

	return (
		<div className="flex w-full max-w-2xl flex-col gap-6">
			<header className="flex flex-col gap-3">
				<div className="flex items-center gap-3">
					<div className="flex size-12 items-center justify-center rounded-full bg-secondary">
						<HugeiconsIcon
							icon={UserIcon}
							className="size-6 text-muted-foreground"
						/>
					</div>
					<div>
						<h1 className="font-heading text-2xl font-semibold">
							{profile.display_name}
						</h1>
					</div>
				</div>
			</header>

			<Card>
				<CardHeader>
					<CardTitle>Insignias</CardTitle>
					<CardDescription>
						{profile.awards.length === 0
							? "Aún sin insignias."
							: `${profile.awards.length} ${profile.awards.length === 1 ? "insignia" : "insignias"}`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{profile.awards.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							Las insignias se obtienen participando en las sesiones del club.
						</p>
					) : (
						<ul className="flex flex-wrap gap-3">
							{profile.awards.map((award) => (
								<li
									key={award.id}
									className="flex items-center gap-2 rounded-lg border px-3 py-2"
								>
									<HugeiconsIcon
										icon={getBadgeIcon(award.badge_key)}
										size={20}
										className="shrink-0 text-primary"
										aria-hidden="true"
									/>
									<span className="text-sm">{award.name}</span>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
