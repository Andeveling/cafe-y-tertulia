/**
 * Prototipo throwaway — etapa Preguntas.
 * Pregunta: ¿cómo ve cada rol el tablero (Moderador enterado de todo,
 * resto con texto propio privado) y cómo avanza el Moderador avisando
 * a cada faltante si entra con pregunta o como espectador?
 * No muta datos reales. Sin tests, sin persistencia.
 */

export type ProtoMember = {
	id: string;
	name: string;
	isModerator: boolean;
	role: "member" | "spectator";
	/** En la Sala (false = online fuera, convocable). */
	inRoom: boolean;
	online: boolean;
	questionCount: number;
};

export const INITIAL: ProtoMember[] = [
	{
		id: "u-andres",
		name: "Andrés Parra",
		isModerator: true,
		role: "member",
		inRoom: true,
		online: true,
		questionCount: 2,
	},
	{
		id: "u-bruno",
		name: "Bruno Díaz",
		isModerator: false,
		role: "member",
		inRoom: true,
		online: true,
		questionCount: 0,
	},
	{
		id: "u-carla",
		name: "Carla Méndez",
		isModerator: false,
		role: "member",
		inRoom: true,
		online: true,
		questionCount: 1,
	},
	{
		id: "u-lucia",
		name: "Lucía Vega",
		isModerator: false,
		role: "spectator",
		inRoom: true,
		online: true,
		questionCount: 1,
	},
	{
		id: "u-diego",
		name: "Diego Sosa",
		isModerator: false,
		role: "spectator",
		inRoom: true,
		online: true,
		questionCount: 0,
	},
	{
		id: "u-marta",
		name: "Marta Ruiz",
		isModerator: false,
		role: "member",
		inRoom: false,
		online: true,
		questionCount: 1,
	},
];

/** Miembros que frenan el avance: en Sala, no espectadores, sin pregunta. */
export function missing(members: ProtoMember[]): ProtoMember[] {
	return members.filter(
		(m) => m.inRoom && m.role === "member" && m.questionCount === 0,
	);
}

/** Convocables: online pero fuera de la Sala. */
export function convocable(members: ProtoMember[]): ProtoMember[] {
	return members.filter((m) => m.online && !m.inRoom);
}

export type AdvanceDecision = Record<string, "wait" | "spectator">;

export const COPY = {
	privateTitle: "¿Quién ve tu pregunta?",
	private:
		"Tu texto es privado. Los demás solo ven que la enviaste. Solo vos podés corregirla, y solo durante Preguntas.",
	memoryTitle: "Pregunta de espectador",
	memory:
		"No entra al pool del sorteo y queda como memoria del club. Se declara Sin sorteo desde Preguntas o Presentes.",
};
