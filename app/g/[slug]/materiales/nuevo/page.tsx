import { redirect } from "next/navigation";

/**
 * La propuesta directa a la estantería ya no existe (#91): toda entrada
 * nueva nace de una ganadora (sorteo o pacto). Esta ruta solo redirige
 * a la estantería para no romper enlaces guardados.
 */
export default async function NewGroupMaterialPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	redirect(`/g/${slug}/materiales`);
}
