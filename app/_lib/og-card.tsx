/**
 * Tarjeta OG compartida por `opengraph-image` y `twitter-image`.
 * Satori no resuelve variables CSS: los colores vienen de
 * `brand-palette.json` (espejo documentado de los tokens de globals.css).
 */
import palette from "./brand-palette.json";
export function OgCard({ width, height }: { width: number; height: number }) {
	return (
		<div
			style={{
				width,
				height,
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				background: palette.lounge,
				padding: "72px 80px",
				fontFamily: "Georgia, 'Times New Roman', serif",
			}}
		>
			<div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: palette.amber,
						color: palette.cocoa,
						fontFamily: "Arial, Helvetica, sans-serif",
						fontSize: 26,
						fontWeight: 700,
						padding: "10px 26px",
						borderRadius: 999,
						marginBottom: 32,
						width: 300,
					}}
				>
					El club te espera
				</div>
				<div
					style={{
						color: palette.cream,
						fontSize: 96,
						lineHeight: 1.05,
						letterSpacing: "-0.02em",
					}}
				>
					Café y Tertulias
				</div>
				<div
					style={{
						color: palette.honey,
						fontFamily: "Arial, Helvetica, sans-serif",
						fontSize: 34,
						marginTop: 24,
					}}
				>
					Club de lectura y conversación
				</div>
			</div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: 360,
					height: 360,
					borderRadius: 96,
					background: palette.amber,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: 280,
						height: 280,
						borderRadius: 140,
						background: palette.espresso,
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 196,
							height: 196,
							borderRadius: 98,
							background: palette.paper,
						}}
					>
						<div
							style={{
								width: 140,
								height: 140,
								borderRadius: 70,
								background: palette.caramel,
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
