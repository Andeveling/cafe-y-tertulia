import type { Metadata } from "next";
import { Geist_Mono, Literata, Manrope } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import { LAST_GROUP_COOKIE } from "@/lib/groups/active-group";
import { getMyGroups } from "@/lib/groups/queries";
import "./globals.css";
import { ConvocatoriaInbox } from "@/app/_components/convocatoria-inbox";
import { getMemberLevel } from "@/app/profile/_lib/gamification-actions";
import { AppShell } from "@/components/app-shell";
import {
	SIDEBAR_COOKIE_NAME,
	sidebarOpenFromCookie,
} from "@/lib/sidebar-preference";
import { siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const literata = Literata({
	variable: "--font-literata",
	subsets: ["latin"],
	weight: ["400", "600", "700"],
});

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const siteDescription =
	"Club de lectura y conversación. Sesiones, materiales y tertulia — el club te espera.";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl()),
	title: "Café y Tertulias",
	description: siteDescription,
	applicationName: "Café y Tertulias",
	openGraph: {
		type: "website",
		locale: "es_ES",
		url: "/",
		siteName: "Café y Tertulias",
		title: "Café y Tertulias",
		description: siteDescription,
		images: [
			{
				url: "/opengraph-image",
				width: 1200,
				height: 630,
				alt: "Café y Tertulias — Club de lectura y conversación",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Café y Tertulias",
		description: siteDescription,
		images: ["/twitter-image"],
	},
};

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	let navUser: { name: string; email: string; avatar?: string | null } | null =
		null;
	let memberStatus: string | null = null;
	if (user) {
		const { data: member } = await supabase
			.from("members")
			.select("display_name, status, avatar")
			.eq("id", user.id)
			.maybeSingle();
		if (member) {
			navUser = {
				name: member.display_name || user.email || "Miembro",
				email: user.email || "",
				avatar: member.avatar,
			};
			memberStatus = member.status;
		} else {
			navUser = { name: user.email || "Miembro", email: user.email || "" };
		}
	}

	const memberLevel = user ? await getMemberLevel(user.id) : null;

	const cookieStore = await cookies();
	const defaultSidebarOpen = sidebarOpenFromCookie(
		cookieStore.get(SIDEBAR_COOKIE_NAME)?.value,
	);
	const rememberedSlug = cookieStore.get(LAST_GROUP_COOKIE)?.value ?? null;
	const groups =
		user && memberStatus === "active"
			? (await getMyGroups(supabase, user.id)).map((group) => ({
					slug: group.slug,
					name: group.name,
					role: group.role,
					visibility: group.visibility,
				}))
			: [];

	return (
		<html
			lang="es"
			className={cn(
				"dark",
				"h-full",
				"antialiased",
				literata.variable,
				manrope.variable,
				geistMono.variable,
				"font-sans",
			)}
		>
			<body className="min-h-full">
				{process.env.NODE_ENV === "development" && (
					<Script
						src="//unpkg.com/react-grab/dist/index.global.js"
						crossOrigin="anonymous"
						strategy="afterInteractive"
					/>
				)}
				<AppShell
					user={navUser}
					groups={groups}
					rememberedSlug={rememberedSlug}
					defaultOpen={defaultSidebarOpen}
					level={memberLevel}
					inbox={
						user && memberStatus === "active" ? (
							<ConvocatoriaInbox userId={user.id} />
						) : null
					}
				>
					{children}
				</AppShell>
			</body>
		</html>
	);
}
