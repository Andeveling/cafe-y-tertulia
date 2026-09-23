/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupSwitcher } from "@/app/g/_components/group-switcher";
import { MisGruposView } from "@/app/g/_components/mis-grupos-view";
import { PublicCatalog } from "@/app/g/_components/public-catalog";

const push = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push }),
	usePathname: () => "/g/nojau",
}));

afterEach(() => {
	cleanup();
	push.mockClear();
});

const myGroups = [
	{
		id: "g1",
		slug: "nojau",
		name: "Nojau",
		description: null,
		avatar: null,
		visibility: "private" as const,
		role: "admin" as const,
		online_count: 2,
		member_count: 5,
	},
	{
		id: "g2",
		slug: "cine",
		name: "Cine",
		description: null,
		avatar: null,
		visibility: "public" as const,
		role: "member" as const,
		online_count: 0,
		member_count: 3,
	},
];

const catalog = [
	{
		id: "g3",
		slug: "filosofia",
		name: "Filosofía",
		description: "Tertulia abierta",
		avatar: null,
		visibility: "public" as const,
		member_count: 4,
		material_count: 2,
		session_count: 1,
	},
];

describe("MisGruposView", () => {
	it("renderiza mis grupos con presencia sin nombres cruzados", () => {
		render(<MisGruposView myGroups={myGroups} catalog={catalog} />);
		expect(screen.getByText("Nojau")).toBeInTheDocument();
		expect(screen.getByText("Cine")).toBeInTheDocument();
		// Conteo online por grupo, sin exponer quién está en línea.
		expect(screen.getByText(/2 en línea/)).toBeInTheDocument();
	});

	it("sin grupos muestra el catálogo público y el crear", () => {
		render(<MisGruposView myGroups={[]} catalog={catalog} />);
		expect(
			screen.getByRole("heading", { name: /catálogo público/i }),
		).toBeInTheDocument();
		expect(screen.getByText("Filosofía")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /crear grupo/i }),
		).toBeInTheDocument();
	});

	it("el catálogo no filtra contenido interno", () => {
		const { container } = render(
			<MisGruposView myGroups={[]} catalog={catalog} />,
		);
		expect(container.textContent).not.toMatch(/pregunta secreta/i);
		expect(screen.getByText("Filosofía")).toBeInTheDocument();
	});
});

describe("GroupSwitcher", () => {
	it("navega al grupo elegido sin cerrar sesión", async () => {
		render(<GroupSwitcher groups={myGroups} currentSlug="nojau" />);
		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: /cambiar de grupo/i }));
		await user.click(screen.getByText("Cine"));
		expect(push).toHaveBeenCalledWith("/g/cine");
	});
});

describe("PublicCatalog", () => {
	it("muestra nombre, descripción y conteos sin contenido interno", () => {
		render(<PublicCatalog groups={catalog} />);
		expect(screen.getByText("Filosofía")).toBeInTheDocument();
		expect(screen.getByText("Tertulia abierta")).toBeInTheDocument();
		expect(screen.getByText(/4 miembros/)).toBeInTheDocument();
	});

	it("settings solo visible para admin (no se renderiza aquí)", () => {
		render(<PublicCatalog groups={catalog} />);
		expect(screen.queryByText(/ajustes del grupo/i)).not.toBeInTheDocument();
	});
});
