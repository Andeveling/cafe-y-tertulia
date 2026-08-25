import { describe, expect, it } from "vitest";
import {
	formatTimeLeft,
	invitationDisplayStatus,
	invitationProgress,
} from "@/app/invite/_lib/invitation-time";

const start = "2026-08-25T12:00:00.000Z";
const end = "2026-08-26T12:00:00.000Z";

describe("invitationProgress", () => {
	it("a mitad de vida queda ~50%", () => {
		const mid = Date.parse("2026-08-26T00:00:00.000Z");
		const p = invitationProgress(start, end, mid);
		expect(p.ratio).toBeCloseTo(0.5);
		expect(p.live).toBe(true);
	});

	it("vencida no es live y el ratio es 0", () => {
		const later = Date.parse("2026-08-27T00:00:00.000Z");
		const p = invitationProgress(start, end, later);
		expect(p.ratio).toBe(0);
		expect(p.live).toBe(false);
	});
});

describe("invitationDisplayStatus", () => {
	it("pending viva es Pendiente", () => {
		expect(
			invitationDisplayStatus(
				{ status: "pending", expires_at: end },
				Date.parse("2026-08-25T18:00:00.000Z"),
			),
		).toBe("pending");
	});

	it("pending con fecha pasada es Vencida", () => {
		expect(
			invitationDisplayStatus(
				{ status: "pending", expires_at: end },
				Date.parse("2026-08-27T00:00:00.000Z"),
			),
		).toBe("expired");
	});

	it("expired en DB es Revocada", () => {
		expect(
			invitationDisplayStatus({ status: "expired", expires_at: end }),
		).toBe("revoked");
	});
});

describe("formatTimeLeft", () => {
	it("formatea horas y minutos", () => {
		expect(formatTimeLeft(90 * 60_000)).toBe("1 h 30 min");
		expect(formatTimeLeft(30_000)).toBe("menos de 1 min");
	});
});
