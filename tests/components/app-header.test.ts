import { describe, expect, it } from "vitest";
import { getBreadcrumbs } from "@/components/app-header";

describe("getBreadcrumbs", () => {
	it("labels resource routes without exposing IDs or linking the sessions group", () => {
		expect(
			getBreadcrumbs("/materials/material-id/sessions/session-id/stage"),
		).toEqual([
			{ href: "/materials", label: "Materiales" },
			{ href: "/materials/material-id", label: "Material" },
			{ href: undefined, label: "Sesiones" },
			{
				href: "/materials/material-id/sessions/session-id",
				label: "Sesión",
			},
			{
				href: "/materials/material-id/sessions/session-id/stage",
				label: "Escenario",
			},
		]);
	});
});
