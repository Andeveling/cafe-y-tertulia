import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

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
	if (user) {
		const { data: member } = await supabase
			.from("members")
			.select("display_name")
			.eq("id", user.id)
			.maybeSingle();

		const avatar =
			(user.user_metadata?.avatar_url as string | undefined) ??
			(user.user_metadata?.picture as string | undefined) ??
			null;

		if (member) {
			navUser = {
				name: member.display_name,
				email: user.email ?? "",
				avatar,
			};
		} else if (user.email) {
			navUser = {
				name: user.email.split("@")[0],
				email: user.email,
				avatar,
			};
		}
	}

	return (
		<html
			lang="es"
			suppressHydrationWarning
			className={cn(
				"h-full",
				"antialiased",
				geistSans.variable,
				geistMono.variable,
				"font-sans",
				inter.variable,
			)}
		>
			<body className="min-h-full">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<SidebarProvider>
						<AppSidebar user={navUser} />
						<SidebarInset>
							<AppHeader />
							<div className="flex flex-1 flex-col">{children}</div>
						</SidebarInset>
					</SidebarProvider>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
