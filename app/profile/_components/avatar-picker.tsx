"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { updateAvatar } from "@/app/profile/_lib/profile-actions";
import { memberInitials } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { AVATARS } from "@/lib/avatars";
import { cn } from "@/lib/utils";

/**
 * Elige tu avatar del club. Radios nativos: una sola parada de tab y
 * flechas por grupo. La selección es local hasta Guardar, que la vincula
 * al miembro vía server action.
 */
export function AvatarPicker({
	currentAvatar,
	displayName,
}: {
	currentAvatar: string | null;
	displayName: string;
}) {
	const [isPending, startTransition] = useTransition();
	const [selected, setSelected] = useState<string>(currentAvatar ?? "");
	const dirty = selected !== (currentAvatar ?? "");

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		startTransition(async () => {
			const formData = new FormData();
			formData.set("avatar", selected);
			await updateAvatar(formData);
		});
	}

	const ring = cn(
		"ring-2 ring-offset-2 ring-offset-card transition outline-none",
		"peer-focus-visible:ring-primary peer-checked:ring-primary",
	);

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-4">
			<fieldset>
				<legend className="sr-only">Elegí tu avatar</legend>
				<div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
					<label title="Sin avatar (iniciales)" className="cursor-pointer">
						<input
							type="radio"
							name="avatar"
							value=""
							checked={selected === ""}
							onChange={() => setSelected("")}
							aria-label="Sin avatar, usar iniciales"
							className="peer sr-only"
						/>
						<span
							aria-hidden="true"
							className={cn(
								"grid aspect-square place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground ring-transparent hover:ring-border",
								ring,
							)}
						>
							{memberInitials(displayName)}
						</span>
					</label>
					{AVATARS.map((a, i) => (
						<label key={a.src} title={a.label} className="cursor-pointer">
							<input
								type="radio"
								name="avatar"
								value={a.src}
								checked={selected === a.src}
								onChange={() => setSelected(a.src)}
								aria-label={a.label}
								className="peer sr-only"
							/>
							<span
								aria-hidden="true"
								className={cn(
									"block aspect-square rounded-full ring-transparent hover:ring-border",
									ring,
								)}
							>
								<Image
									src={a.src}
									alt=""
									width={96}
									height={96}
									loading={i > 6 ? "lazy" : undefined}
									draggable={false}
									className="size-full rounded-full"
								/>
							</span>
						</label>
					))}
				</div>
			</fieldset>
			<Button
				type="submit"
				className="min-h-11 self-start"
				disabled={isPending || !dirty}
			>
				{isPending ? "Guardando…" : "Guardar avatar"}
			</Button>
		</form>
	);
}
