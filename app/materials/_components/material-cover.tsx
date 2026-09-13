"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function MaterialCover({
	src,
	alt,
	className,
	fallback,
}: {
	src: string | null | undefined;
	alt: string;
	className?: string;
	fallback: React.ReactNode;
}) {
	const [failed, setFailed] = useState(false);
	if (!src || failed) return <>{fallback}</>;
	return (
		// biome-ignore lint/performance/noImgElement: URL externa arbitraria, sin remotePatterns
		<img
			src={src}
			alt={alt}
			loading="lazy"
			onError={() => setFailed(true)}
			className={cn("h-full w-full object-cover", className)}
		/>
	);
}
