import type { Metadata } from "next";
import { Geist_Mono, Literata, Manrope } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { ConvocatoriaInbox } from "@/app/_components/convocatoria-inbox";
import { getMemberLevel } from "@/app/profile/_lib/gamification-actions";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import {
	SIDEBAR_COOKIE_NAME,
	sidebarOpenFromCookie,
} from "@/lib/sidebar-preference";
import { createClient } from "@/lib/supabase/server";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
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

export const metadata: Metadata = {
	title: "Café y Tertulias",
	description: "Club de lectura y conversación.",
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

	return (
		<html
			lang="es"
			suppressHydrationWarning
			className={cn(
				"h-full",
				"antialiased",
				literata.variable,
				manrope.variable,
				geistMono.variable,
				"font-sans",
			)}
		>
			<body className="min-h-full">
				<Script id="theme-init" strategy="beforeInteractive">
					{THEME_INIT_SCRIPT}
				</Script>
				{process.env.NODE_ENV === "development" && (
					<Script
						src="//unpkg.com/react-grab/dist/index.global.js"
						crossOrigin="anonymous"
						strategy="afterInteractive"
					/>
				)}
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem
					disableTransitionOnChange
				>
					<AppShell
						user={navUser}
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
				</ThemeProvider>
			</body>
		</html>
	);
}
