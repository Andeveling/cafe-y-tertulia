import { UserMultiple02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import type { SessionHistory } from "@/app/materials/_lib/materials";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type Participant = SessionHistory["participants"][number];

/**
 * Lista de participantes de una sesión en el Histórico.
 * Cada nombre es un link al perfil del Miembro; los que marcaron
 * "sin sorteo" llevan un indicador visual.
 */
export function HistoryParticipants({
	participants,
}: {
	participants: Participant[];
}) {
	if (participants.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<HugeiconsIcon
						icon={UserMultiple02Icon}
						className="size-4 text-muted-foreground"
					/>
					Participantes
				</CardTitle>
				<CardDescription>
					{participants.length}{" "}
					{participants.length === 1 ? "persona" : "personas"} en esta sesión
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-wrap gap-2">
					{participants.map((p) => (
						<li key={p.member_id}>
							<Link
								href={`/members/${p.member_id}`}
								className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground underline-offset-4 transition-colors hover:bg-secondary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
							>
								<span>{p.display_name}</span>
								{p.opt_out && (
									<Badge
										variant="outline"
										className="border-secondary-foreground/30 text-xs text-secondary-foreground"
									>
										sin sorteo
									</Badge>
								)}
							</Link>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
