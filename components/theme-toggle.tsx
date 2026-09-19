"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const labels = { light: "Claro", dark: "Oscuro", system: "Sistema" } as const;

/** Cicla light → dark → system. */
function nextTheme(current: string | undefined) {
	if (current === "light") return "dark";
	// if (current === "dark") return "system";
	return "light";
}

/** Taza de café con vapor (claro) o luna (oscuro). */
function CoffeeIcon({ theme }: { theme: string | undefined }) {
	const isDark = theme === "dark";

	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			{/* Vapor / luna */}
			{isDark ? (
				<path d="M17 3a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 17 8a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 17 3Z" />
			) : (
				<>
					<path d="M8 14v.5" />
					<path d="M12 14v.5" />
					<path d="M16 14v.5" />
				</>
			)}
			{/* Taza */}
			<path d="M17 8h2a2 2 0 0 1 0 4h-1" />
			<path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
			{/* Plato */}
			<line x1="6" y1="2" x2="6" y2="4" />
			<line x1="10" y1="2" x2="10" y2="4" />
			<line x1="14" y1="2" x2="14" y2="4" />
		</svg>
	);
}

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	// Evita hydration mismatch: renderizamos el icono por defecto hasta montar
	if (!mounted) {
		return (
			<Button variant="outline" size="icon-lg" aria-label="Cambiar tema">
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M8 14v.5" />
					<path d="M12 14v.5" />
					<path d="M16 14v.5" />
					<path d="M17 8h2a2 2 0 0 1 0 4h-1" />
					<path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
					<line x1="6" y1="2" x2="6" y2="4" />
					<line x1="10" y1="2" x2="10" y2="4" />
					<line x1="14" y1="2" x2="14" y2="4" />
				</svg>
			</Button>
		);
	}

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="ghost"
						size="icon-lg"
						aria-label={`Tema: ${labels[theme as keyof typeof labels] ?? "Sistema"}`}
					/>
				}
				onClick={() => setTheme(nextTheme(theme))}
			>
				<CoffeeIcon theme={theme} />
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{labels[theme as keyof typeof labels] ?? "Sistema"}
			</TooltipContent>
		</Tooltip>
	);
}
