import type { InviteRosterMember } from "@/app/materials/_lib/presence-invite";
import type { RoomSnapshot } from "@/app/materials/_lib/room-types";
import type { SalaView } from "@/app/materials/_lib/room-view";

export type EtapaProps = {
	snapshot: RoomSnapshot;
	view: SalaView;
	userId: string;
	isModerator: boolean;
	rosterMembers?: InviteRosterMember[];
	pendingIds?: string[];
};
