import { redirect } from "next/navigation";
import { LibraryView } from "@/app/library/_components/library-view";
import { listBiblioteca } from "@/app/materials/_lib/biblioteca-store";
import { getCurrentMember } from "@/lib/current-member";

export const metadata = { title: "Mi biblioteca · Café y Tertulias" };

/**
 * Biblioteca personal en ruta propia: la colección privada global del
 * Miembro vive aquí, no dentro de /profile. Desde aquí guarda candidatos
 * para postular después hacia cada Grupo.
 */
export default async function LibraryPage() {
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	const items = await listBiblioteca();

	return <LibraryView items={items} />;
}
