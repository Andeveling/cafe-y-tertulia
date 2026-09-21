import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";

export type BoardSession = {
	id: string;
	status: "lobby" | "in_progress" | "preparation";
	scheduled_at: string | null;
	range: string | null;
	moderator_id: string | null;
	moderator_name: string | null;
	/** Src del catálogo (`members.avatar`) o null = iniciales. */
	moderator_avatar: string | null;
	material_id: string | null;
	material_title: string | null;
};

export function sessionTitle(s: BoardSession): string {
	if (s.range) return s.range;
	if (s.material_title) return s.material_title;
	return `Sesión de ${s.moderator_name ?? "alguien"}`;
}

/** Título editorial: el libro/material manda; el rango va al subtítulo. */
export function editorialTitle(s: BoardSession): string {
	return s.material_title?.trim() || sessionTitle(s);
}

export function sessionSubtitle(s: BoardSession): string | null {
	const title = editorialTitle(s);
	if (s.range?.trim() && s.range !== title) return s.range;
	return null;
}

export function splitHeadline(title: string): {
	lead: string;
	accent: string | null;
} {
	const idx = title.indexOf(": ");
	if (idx <= 0) return { lead: title, accent: null };
	const accent = title.slice(idx + 2).trim();
	return { lead: `${title.slice(0, idx)}:`, accent: accent || null };
}

export type SessionFilter = "all" | "live" | "scheduled";

export function matchesFilter(s: BoardSession, filter: SessionFilter): boolean {
	if (filter === "live")
		return s.status === "lobby" || s.status === "in_progress";
	if (filter === "scheduled") return s.status === "preparation";
	return true;
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

/** preparation abre de verdad; lobby/en curso solo entran. */
export function sessionOpensSala(status: BoardSession["status"]): boolean {
	return status === "preparation";
}

/** Fecha pactada = aún no se abre desde el tablero. Sala viva sí. */
export function sessionHasBoardCta(
	s: Pick<BoardSession, "status" | "scheduled_at">,
): boolean {
	if (s.status === "lobby" || s.status === "in_progress") return true;
	return s.status === "preparation" && !s.scheduled_at;
}

export function othersHeading(others: BoardSession[]): string {
	const live = others.filter(
		(s) => s.status === "lobby" || s.status === "in_progress",
	);
	if (live.length === others.length) return "También abiertas";
	if (live.length === 0) return "Programadas";
	return "Otras";
}

/** Solo el día: al crear se elige fecha, no hora. */
export function whenLabel(iso: string | null): string {
	if (!iso) return "Sin fecha";
	const d = new Date(iso);
	const now = new Date();
	const today = format(now, "yyyy-MM-dd");
	const tomorrow = format(new Date(now.getTime() + 86_400_000), "yyyy-MM-dd");
	const day = format(d, "yyyy-MM-dd");
	if (day === today) return "Hoy";
	if (day === tomorrow) return "Mañana";
	return format(d, "EEE d MMM", { locale: es });
}

/** Días de calendario hasta la sesión. Sin hora: al crear se elige solo el día. */
export function daysUntilLabel(iso: string | null): string | null {
	if (!iso) return null;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return null;
	const n = differenceInCalendarDays(d, new Date());
	if (n <= 0) return "Es hoy";
	if (n === 1) return "Falta 1 día para la sesión";
	return `Faltan ${n} días para la sesión`;
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
