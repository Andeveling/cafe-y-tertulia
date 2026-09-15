/**
 * Convocatoria: quién mostrar, a quién Llamar y a quién etiquetar.
 * Inicio y Presentes renderizan este resultado (ADR 0010).
 */

import { type EstadoPresencia, puedeLlamar } from "@/lib/presencia/estado";

export type MiembroPresencia = {
	id: string;
	display_name: string;
	estado: EstadoPresencia;
};

export type FilaConvocatoria = {
	id: string;
	displayName: string;
	estado: EstadoPresencia;
	llamable: boolean;
	pending: boolean;
	enOtraSala: boolean;
};

export function resuelveConvocatoria(args: {
	roster: MiembroPresencia[];
	pendingIds?: Iterable<string>;
	selfId?: string | null;
}): FilaConvocatoria[] {
	const pending = new Set(args.pendingIds ?? []);
	return args.roster
		.filter((m) => !args.selfId || m.id !== args.selfId)
		.map((m) => {
			const isPending = pending.has(m.id);
			return {
				id: m.id,
				displayName: m.display_name,
				estado: m.estado,
				llamable: puedeLlamar(m.estado) && !isPending,
				pending: isPending,
				enOtraSala: m.estado === "en_sesion",
			};
		});
}
