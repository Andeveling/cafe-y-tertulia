import { format } from "date-fns";
import { es } from "date-fns/locale";

export type BoardSession = {
	id: string;
	status: "lobby" | "in_progress" | "preparation";
	scheduled_at: string | null;
	range: string | null;
	moderator_id: string | null;
	moderator_name: string | null;
	material_title: string | null;
};

export function sessionTitle(s: BoardSession): string {
	if (s.range) return s.range;
	if (s.material_title) return s.material_title;
	return `Sesión de ${s.moderator_name ?? "alguien"}`;
}

export function statusMeta(status: BoardSession["status"]) {
	switch (status) {
		case "lobby":
			return { label: "Sala abierta", live: true };
		case "in_progress":
			return { label: "En curso", live: true };
		default:
			return { label: "Próxima", live: false };
	}
}

/** Toda sesión del tablero entra a la Sala. Histórico es otra ruta. */
export function sessionHref(s: Pick<BoardSession, "id" | "status">): string {
	return `/materials/sessions/${s.id}/room`;
}

export function sessionCta(
	status: BoardSession["status"],
	variant: "hero" | "row",
): string {
	if (status === "preparation") return "Abrir sala";
	return variant === "hero" ? "Entrar a la sala" : "Entrar";
}

export function othersHeading(others: BoardSession[]): string {
	const live = others.filter(
		(s) => s.status === "lobby" || s.status === "in_progress",
	);
	if (live.length === others.length) return "También abiertas";
	if (live.length === 0) return "Programadas";
	return "Otras";
}

export function whenLabel(iso: string | null): string {
	if (!iso) return "Sin fecha";
	const d = new Date(iso);
	const now = new Date();
	const today = format(now, "yyyy-MM-dd");
	const tomorrow = format(new Date(now.getTime() + 86_400_000), "yyyy-MM-dd");
	const day = format(d, "yyyy-MM-dd");
	if (day === today) return `Hoy ${format(d, "HH:mm")}`;
	if (day === tomorrow) return `Mañana ${format(d, "HH:mm")}`;
	return format(d, "EEE d MMM, HH:mm", { locale: es });
}

export function splitSessions(sessions: BoardSession[]) {
	const live = sessions.filter(
		(s) => s.status === "lobby" || s.status === "in_progress",
	);
	const scheduled = sessions.filter((s) => s.status === "preparation");
	const hero = live[0] ?? scheduled[0] ?? null;
	const others =
		hero && live.includes(hero)
			? [...live.slice(1), ...scheduled]
			: [...live, ...scheduled.slice(1)];
	return { hero, others };
}
