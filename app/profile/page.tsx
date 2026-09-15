import { redirect } from "next/navigation";
import { ProfileView } from "@/app/profile/_components/profile-view";
import { getCurrentMember } from "@/lib/current-member";
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

	const [{ badges, recognitions }, level] = await Promise.all([
		getMemberBadges(member.id),
		getMemberLevel(member.id),
	]);

	return (
		<ProfileView
			displayName={member.display_name}
			status={member.status}
			level={level}
			badges={badges}
			recognitions={recognitions}
			updated={params.updated === "1"}
			updateFailed={params.error === "update_failed"}
		/>
	);
}
