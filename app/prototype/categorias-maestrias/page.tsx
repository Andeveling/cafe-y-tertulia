// PROTOTYPE — throwaway, no tests. Question: ¿cómo se etiquetan Categorías y dónde
// se ven las Maestrías (ficha de material, perfil del miembro o mesa del club)?
// Tres variantes estructurales sobre /prototype/categorias-maestrias?variant=

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

const VARIANTS = ["A", "B", "C"] as const;

function Switcher() {
	const params = useSearchParams();
	const router = useRouter();
	const current = params.get("variant") ?? "A";
	return (
		<div className="fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-card px-3 py-2 shadow-lg">
			<span className="px-1 text-xs uppercase tracking-[0.05em] text-muted-foreground">
				Proto
			</span>
			{VARIANTS.map((v) => (
				<Button
					key={v}
					size="sm"
					variant={current === v ? "default" : "ghost"}
					onClick={() => router.replace(`?variant=${v}`)}
				>
					{v}
				</Button>
			))}
		</div>
	);
}

function Body() {
	const params = useSearchParams();
	const variant = params.get("variant") ?? "A";
	if (variant === "B") return <VariantB />;
	if (variant === "C") return <VariantC />;
	return <VariantA />;
}

export default function CategoriasMaestriasPrototypePage() {
	return (
		<Suspense>
			<Body />
			<Switcher />
		</Suspense>
	);
}
