import { ImageResponse } from "next/og";
import { OgCard } from "./_lib/og-card";

export const alt = "Café y Tertulias — Club de lectura y conversación";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
	return new ImageResponse(<OgCard width={size.width} height={size.height} />, {
		...size,
	});
}
