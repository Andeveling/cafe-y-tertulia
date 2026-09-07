/**
 * Prototipo throwaway — etapa Presentes.
 * Pregunta: ¿cómo se entiende presencia, “listo” y el opt-out del sorteo
 * sin que el botón “Sin sorteo” compita con “Estoy presente”?
 */

export type ProtoMember = {
	id: string;
	name: string;
	role: "member" | "spectator";
	present: boolean;
	hasQuestion: boolean;
	optOut: boolean;
	isYou: boolean;
};

export const INITIAL: ProtoMember[] = [
	{
		id: "u-andres",
		name: "Andrés Parra",
		role: "member",
		present: true,
		hasQuestion: true,
		optOut: false,
		isYou: true,
	},
	{
		id: "u-tertuliano",
		name: "Tertuliano Test",
		role: "member",
		present: true,
		hasQuestion: true,
		optOut: false,
		isYou: false,
	},
	{
		id: "u-marta",
		name: "Marta Ruiz",
		role: "member",
		present: false,
		hasQuestion: true,
		optOut: false,
		isYou: false,
	},
	{
		id: "u-lucia",
		name: "Lucía Vega",
		role: "spectator",
		present: true,
		hasQuestion: false,
		optOut: false,
		isYou: false,
	},
];

export function isReady(m: ProtoMember) {
	return m.role === "member" && m.present && m.hasQuestion;
}

export const COPY = {
	listoTitle: "Listo",
	listo:
		"Listo = presente en la tertulia y con al menos una pregunta enviada. El sorteo espera a que todos los miembros estén listos.",
	sorteoTitle: "El sorteo",
	sorteo:
		"El sorteo asigna una pregunta a cada miembro. Si preferís no que te toque una, quedás fuera del sorteo: seguís en la tertulia, solo no te asignan pregunta.",
};
