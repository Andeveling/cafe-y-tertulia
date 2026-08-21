"use client";

import {
	ArrowUpDownIcon,
	Github01Icon,
	Logout01Icon,
	UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useTransition } from "react";
import { signOut } from "@/app/profile/_lib/profile-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

export type NavUserProps = {
	user: {
		name: string;
		email: string;
		avatar?: string | null;
	};
};

function getInitials(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "CT";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const GITHUB_DISCUSSIONS_URL =
	"https://github.com/Andeveling/cafe-y-tertulia/discussions/new/choose";

export function NavUser({ user }: NavUserProps) {
	const { isMobile } = useSidebar();
	const [isPending, startTransition] = useTransition();
	const initials = getInitials(user.name);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							/>
						}
					>
						<Avatar className="h-8 w-8 rounded-lg">
							{user.avatar ? (
								<AvatarImage src={user.avatar} alt={user.name} />
							) : null}
							<AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{user.name}</span>
							<span className="truncate text-xs text-muted-foreground">
								{user.email}
							</span>
						</div>
						<HugeiconsIcon
							icon={ArrowUpDownIcon}
							className="ml-auto size-4 opacity-60"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--anchor-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									{user.avatar ? (
										<AvatarImage src={user.avatar} alt={user.name} />
									) : null}
									<AvatarFallback className="rounded-lg">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-xs text-muted-foreground">
										{user.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								render={<Link href="/profile" />}
								className="gap-2"
							>
								<HugeiconsIcon icon={UserCircleIcon} className="size-4" />
								Perfil
							</DropdownMenuItem>
							<DropdownMenuItem
								render={
									<a
										href={GITHUB_DISCUSSIONS_URL}
										target="_blank"
										rel="noreferrer"
									/>
								}
								className="gap-2"
							>
								<HugeiconsIcon icon={Github01Icon} className="size-4" />
								Iniciar discusión
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							disabled={isPending}
							onClick={() => {
								startTransition(async () => {
									await signOut();
								});
							}}
							className="gap-2"
						>
							<HugeiconsIcon icon={Logout01Icon} className="size-4" />
							{isPending ? "Saliendo…" : "Cerrar sesión"}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
