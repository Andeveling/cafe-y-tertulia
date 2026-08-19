import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { leaveClub, signOut, updateProfile } from "@/lib/memberships/actions";
import { getCurrentMember } from "@/lib/memberships/current-member";

export default async function ProfilePage({
	searchParams,
}: {
	searchParams: Promise<{ updated?: string; error?: string }>;
}) {
	const params = await searchParams;
	const { member } = await getCurrentMember();
	if (!member) {
		redirect("/auth/login");
	}

	return (
		<div className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">Tu perfil</h1>
				<p className="text-sm text-muted-foreground">
					Tu nombre visible y el estado de tu membresía.
				</p>
			</div>

			{params.updated === "1" && (
				<div
					role="status"
					className="mt-4 rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground"
				>
					Perfil actualizado.
				</div>
			)}

			{params.error === "update_failed" && (
				<div
					role="alert"
					className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
				>
					No pudimos guardar los cambios. Intentá de nuevo.
				</div>
			)}

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>Nombre visible</CardTitle>
					<CardDescription>
						Es el nombre con el que te ve el resto del club.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={updateProfile} className="flex flex-col gap-4">
						<Field>
							<FieldLabel htmlFor="displayName">Nombre</FieldLabel>
							<FieldContent>
								<Input
									id="displayName"
									name="displayName"
									type="text"
									autoComplete="nickname"
									required
									maxLength={60}
									defaultValue={member.display_name}
								/>
							</FieldContent>
						</Field>
						<Button type="submit" className="self-start">
							Guardar
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>Membresía</CardTitle>
					<CardDescription>
						Estado:{" "}
						<span className="font-medium text-foreground">
							{member.status === "active"
								? "activo"
								: member.status === "invited"
									? "invitado"
									: "baja"}
						</span>
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Si te das de baja, tus aportes quedan como memoria del club y no
						podrás iniciar sesión.
					</p>
					<form action={leaveClub} className="flex gap-2">
						<Button type="submit" variant="destructive">
							Darme de baja
						</Button>
					</form>
				</CardContent>
			</Card>

			<div className="mt-8">
				<form action={signOut}>
					<Button type="submit" variant="outline">
						Cerrar sesión
					</Button>
				</form>
			</div>
		</div>
	);
}
