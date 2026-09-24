import { redirect } from "next/navigation";

/**
 * Padrinazgo de plataforma congelado (ADR-0014): el enlace viejo de
 * plataforma no crea altas nuevas. Deriva al registro abierto.
 */
export default async function InviteAcceptPage() {
	redirect("/auth/register");
}
