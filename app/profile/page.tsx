import { redirect } from "next/navigation";
import { ProfileView } from "@/app/profile/_components/profile-view";
import { getCurrentMember } from "@/lib/current-member";

export default async function ProfilePage() {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	return (
		<ProfileView
			memberId={member.id}
			displayName={member.display_name}
			status={member.status}
			avatar={member.avatar ?? null}
		/>
	);
}
