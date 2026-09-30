import { GroupShelfView } from "@/app/g/[slug]/materials/_components/shelf-view";
import {
	getBiblioteca,
	getMaterials,
	getPostulaciones,
} from "@/app/materials/_lib/materials";
import { requireGroupPage } from "@/lib/groups/page-gate";

export const metadata = { title: "Materiales · Café y Tertulias" };

export default async function GroupMaterialsPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const { group, member } = await requireGroupPage(slug);
	const [materials, postulaciones, biblioteca] = await Promise.all([
		getMaterials(group.id),
		getPostulaciones(group.id),
		getBiblioteca(),
	]);

	return (
		<GroupShelfView
			groupName={group.name}
			groupId={group.id}
			slug={slug}
			memberId={member.id}
			materials={materials}
			postulaciones={postulaciones}
			biblioteca={biblioteca}
		/>
	);
}
