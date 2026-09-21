import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";
import {
	type BoardSession,
	editorialTitle,
	sessionHasBoardCta,
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
					<h3
						data-slot="card-title"
						className="font-heading text-lg leading-snug font-medium text-balance"
					>
						{editorialTitle(session)}
					</h3>
					<CardDescription>
						{subtitle ? `${subtitle} · ` : ""}
						Modera {session.moderator_name ?? "—"}
					</CardDescription>
					{sessionHasBoardCta(session) ? (
						<CardAction>
							<BoardSessionAction session={session} variant="row" />
						</CardAction>
					) : null}
				</CardHeader>
			</Card>
		</li>
	);
}
