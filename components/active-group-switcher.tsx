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
					<div className="flex w-full items-center gap-3">
						<Link href="/" aria-label="Café y Tertulias — inicio">
							<BrandMark />
						</Link>
						<SidebarMenuButton
							size="lg"
							tooltip="Sin grupo"
							className="min-w-0 flex-1"
							render={<Link href="/g" />}
						>
							<GroupLabel title="Sin grupo" />
						</SidebarMenuButton>
					</div>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	if (groups.length === 1 && active) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<div className="flex w-full items-center gap-3">
						<Link href="/" aria-label="Café y Tertulias — inicio">
							<BrandMark />
						</Link>
						<SidebarMenuButton
							size="lg"
							tooltip={active.name}
							className="min-w-0 flex-1"
							render={<Link href={hrefForGroup(active.slug, section)} />}
						>
							<GroupLabel title={active.name} />
						</SidebarMenuButton>
					</div>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<div className="flex w-full items-center gap-3">
					<Link href="/" aria-label="Café y Tertulias — inicio">
						<BrandMark />
					</Link>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<SidebarMenuButton
									size="lg"
									tooltip={title}
									className="min-w-0 flex-1 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								/>
							}
						>
							<GroupLabel title={title} />
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
				</div>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

function GroupLabel({ title }: { title: string }) {
	return (
		<span className="min-w-0 flex-1 truncate text-left font-semibold text-sm tracking-tight group-data-[collapsible=icon]:hidden">
			{title}
		</span>
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
