"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { leaveGroup } from "@/app/g/_lib/group-actions";

/** Salida voluntaria: revoca el acceso; los aportes permanecen. */
export function LeaveGroupButton({ groupId }: { groupId: string }) {
	const router = useRouter();
	const [pending, start] = useTransition();

	return (
		<button
			type="button"
			disabled={pending}
			onClick={() =>
				start(async () => {
					const r = await leaveGroup(groupId);
					if (r.ok) router.push("/g");
				})
			}
			className="w-fit rounded-lg border border-border px-3 py-1.5 text-sm"
		>
			Salir del grupo
		</button>
	);
}
