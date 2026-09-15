import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type BoardSession,
	editorialTitle,
	sessionSubtitle,
	statusMeta,
	whenLabel,
} from "./board-helpers";
import { BoardSessionAction } from "./board-session-action";

export function SessionRow({ session }: { session: BoardSession }) {
	const meta = statusMeta(session.status);
	const when = session.scheduled_at ? whenLabel(session.scheduled_at) : null;
	const subtitle = sessionSubtitle(session);

	return (
		<li>
			<Card size="sm" className="transition-colors hover:ring-primary/40">
				<CardHeader>
					<div className="flex flex-wrap gap-1.5">
						<Badge variant={meta.live ? "default" : "outline"}>
							{meta.label}
						</Badge>
						{when && <Badge variant="outline">{when}</Badge>}
					</div>
					<CardTitle className="text-lg">{editorialTitle(session)}</CardTitle>
					<CardDescription>
						{subtitle ? `${subtitle} · ` : ""}
						Modera {session.moderator_name ?? "—"}
					</CardDescription>
					<CardAction>
						<BoardSessionAction session={session} variant="row" />
					</CardAction>
				</CardHeader>
			</Card>
		</li>
	);
}
