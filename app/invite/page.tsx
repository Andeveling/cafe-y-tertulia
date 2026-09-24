import { redirect } from "next/navigation";

/**
 * Panel de padrinazgo congelado (ADR-0014): nada nuevo escribe en la tabla
 * de invitaciones globales (histórico). Invitar hoy es compartir el enlace
 * del Grupo desde sus ajustes; Mis Grupos es la puerta.
 */
export default async function InvitePage() {
	redirect("/g");
}
