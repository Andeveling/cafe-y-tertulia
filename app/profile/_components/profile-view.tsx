import { Suspense } from "react";
import { AvatarPicker } from "@/app/profile/_components/avatar-picker";
import {
	HeroSection,
	HeroSkeleton,
} from "@/app/profile/_components/hero-section";
import { LeaveClubDialogLazy } from "@/app/profile/_components/leave-club-dialog-lazy";
import {
	MasterySection,
	MasterySkeleton,
} from "@/app/profile/_components/mastery-section";
import { UpdateProfileForm } from "@/app/profile/_components/update-profile-form";
import {
	VitrinaSection,
	VitrinaSkeleton,
} from "@/app/profile/_components/vitrina-section";
import { statusLabel } from "@/app/profile/_lib/profile-stats";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { signOut } from "../_lib/profile-actions";

export type ProfileViewProps = {
	memberId: string;
	displayName: string;
	status: string;
	avatar: string | null;
};

/** Compositor de la página de perfil: shell + secciones con stream (Suspense). */
export function ProfileView({
	memberId,
	displayName,
	status,
	avatar,
}: ProfileViewProps) {
	return (
		<div className="flex-1">
			{/* ── Pasaporte de tertulia · hero gamificado ─────────────────── */}
			<Suspense fallback={<HeroSkeleton />}>
				<HeroSection
					memberId={memberId}
					displayName={displayName}
					status={status}
					avatar={avatar}
				/>
			</Suspense>

			{/* ── Vitrina ─────────────────────────────────────────────────── */}
			<Suspense fallback={<VitrinaSkeleton />}>
				<VitrinaSection memberId={memberId} />
			</Suspense>

			{/* ── Maestrías ─────────────────────────────────────────────────── */}
			<Suspense fallback={<MasterySkeleton />}>
				<MasterySection memberId={memberId} />
			</Suspense>

			{/* ── Ajustes tranquilos ──────────────────────────────────────── */}
			<section aria-label="Ajustes del perfil" className="mt-12">
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								<h2>Avatar</h2>
							</CardTitle>
							<CardDescription>
								La cara con la que te ve el resto del club.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<AvatarPicker
								key={avatar ?? "sin-avatar"}
								currentAvatar={avatar}
								displayName={displayName}
							/>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								<h2>Nombre visible</h2>
							</CardTitle>
							<CardDescription>
								Es el nombre con el que te ve el resto del club.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<UpdateProfileForm defaultDisplayName={displayName} />
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								<h2>Membresía</h2>
							</CardTitle>
							<CardDescription>
								Estado:{" "}
								<span className="font-medium text-foreground">
									{statusLabel(status)}
								</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<p className="text-sm text-muted-foreground">
								Si te das de baja, tus aportes quedan como memoria del club y no
								podrás iniciar sesión.
							</p>
							<LeaveClubDialogLazy />
						</CardContent>
					</Card>
				</div>

				<div className="mt-8 flex justify-center">
					<form action={signOut}>
						<Button type="submit" variant="ghost" className="min-h-11">
							Cerrar sesión
						</Button>
					</form>
				</div>
			</section>
		</div>
	);
}
