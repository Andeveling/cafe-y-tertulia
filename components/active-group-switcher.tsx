"use client";

import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import {
	hrefForGroup,
	resolveActiveGroup,
	sectionFromGroupPath,
} from "@/lib/groups/active-group";
import type { GroupRole, GroupVisibility } from "@/lib/groups/types";

export type SwitcherGroup = {
	slug: string;
	name: string;
	role: GroupRole;
	visibility: GroupVisibility;
};

export function ActiveGroupSwitcher({
	groups,
	rememberedSlug,
}: {
	groups: SwitcherGroup[];
	rememberedSlug: string | null;
}) {
	const pathname = usePathname();
	const { isMobile } = useSidebar();
	const active = resolveActiveGroup(groups, pathname, rememberedSlug);
	const section = sectionFromGroupPath(pathname);
	const title =
		active?.name ?? (groups.length === 0 ? "Sin grupo" : "Elige un grupo");

	if (groups.length === 0) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						tooltip="Sin grupo"
						className="gap-3"
						render={<Link href="/g" />}
					>
						<BrandMark />
						<span className="truncate font-semibold text-sm tracking-tight group-data-[collapsible=icon]:hidden">
							Sin grupo
						</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	if (groups.length === 1 && active) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton
						size="lg"
						tooltip={active.name}
						className="gap-3"
						render={<Link href={hrefForGroup(active.slug, section)} />}
					>
						<BrandMark />
						<span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
							<span className="sr-only">Café y Tertulias — </span>
							<span className="truncate font-semibold text-sm tracking-tight">
								{active.name}
							</span>
						</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size="lg"
								tooltip={title}
								className="gap-3 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							/>
						}
					>
						<BrandMark />
						<span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
							<span className="sr-only">Café y Tertulias — </span>
							<span className="truncate font-semibold text-sm tracking-tight">
								{title}
							</span>
						</span>
						<HugeiconsIcon
							icon={ArrowDown01Icon}
							className="ml-auto size-4 opacity-60 group-data-[collapsible=icon]:hidden"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="start"
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel>Grupos</DropdownMenuLabel>
							{groups.map((group) => (
								<DropdownMenuItem
									key={group.slug}
									render={<Link href={hrefForGroup(group.slug, section)} />}
									className="gap-2"
								>
									<span className="flex-1 truncate">{group.name}</span>
									{group.slug === active?.slug ? (
										<HugeiconsIcon icon={Tick02Icon} className="size-4" />
									) : null}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem render={<Link href="/g" />}>
							Mis grupos
						</DropdownMenuItem>
						<DropdownMenuItem render={<Link href="/g?crear=1" />}>
							Crear grupo
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

function BrandMark() {
	return (
		<div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
			<Image
				src="/brand/coffee.svg"
				alt=""
				width={32}
				height={32}
				className="size-8"
				priority
			/>
		</div>
	);
}
