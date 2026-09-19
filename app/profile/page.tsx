import { redirect } from "next/navigation";
import { getMemberMastery } from "@/app/materials/_lib/categories";
import { ProfileView } from "@/app/profile/_components/profile-view";
import { getCurrentMember } from "@/lib/current-member";
import { createClient } from "@/lib/supabase/server";
import { getMemberBadges, getMemberLevel } from "./_lib/gamification-actions";

export default async function ProfilePage({
	searchParams,
}: {
	searchParams: Promise<{ updated?: string; error?: string }>;
}) {
	const params = await searchParams;
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	const supabase = await createClient();
	const [{ badges, recognitions }, level, mastery] = await Promise.all([
		getMemberBadges(member.id),
		getMemberLevel(member.id),
		getMemberMastery(supabase, member.id).catch(() => []),
	]);

	return (
		<ProfileView
			displayName={member.display_name}
			status={member.status}
			level={level}
			badges={badges}
			recognitions={recognitions}
			mastery={mastery.map((m) => ({
				categoryId: m.category.id,
				categoryName: m.category.name,
				level: m.level,
				points: m.points,
			}))}
			updated={params.updated === "1"}
			updateFailed={params.error === "update_failed"}
		/>
	);
}
