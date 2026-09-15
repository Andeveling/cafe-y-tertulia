"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({
	url,
	size = "xs",
	variant = "outline",
}: {
	url: string;
	size?: "xs" | "default";
	variant?: "outline" | "ghost";
}) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		await navigator.clipboard.writeText(url);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	}

	return (
		<Button type="button" variant={variant} size={size} onClick={copy}>
			{copied ? "Copiado" : "Copiar"}
		</Button>
	);
}
